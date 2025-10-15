# Application Deployment Guide (Ubuntu on GCP)

This guide provides the steps to deploy this full-stack application to an Ubuntu server on Google Cloud Platform (GCP).

The application consists of two parts:
1.  A Node.js backend (`server/`)
2.  A React frontend (`client/`)

They need to be built and run separately on the server.

### 1. GCP Compute Engine Setup

1.  **Create a VM Instance**: In your GCP project, go to Compute Engine and create a new VM instance. Select "Ubuntu" as the boot disk (e.g., Ubuntu 22.04 LTS).
2.  **Firewall Rules**: In the VM settings, make sure to "Allow HTTP traffic" and "Allow HTTPS traffic". This opens ports 80 and 443. You will also need to open the port your backend server runs on (e.g., 8080) by creating a separate firewall rule in the "VPC network" -> "Firewall" section of GCP.

### 2. Prepare the Ubuntu Server

1.  **SSH into your VM**: Connect to your new Ubuntu server using the SSH button in the GCP console.
2.  **Install Node.js and npm**:
    ```bash
    sudo apt update
    sudo apt install nodejs npm -y
    ```
3.  **Install a Web Server (Nginx)**: This will serve your React app and act as a reverse proxy for your backend.
    ```bash
    sudo apt install nginx -y
    ```
4.  **Install a Process Manager (PM2)**: This will keep your backend Node.js server running continuously.
    ```bash
    sudo npm install -g pm2
    ```
5.  **Install Git**: To get your code onto the server.
    ```bash
    sudo apt install git -y
    ```

### 3. Deploy Your Application

1.  **Clone Your Code**: Clone your project repository onto the server.
    ```bash
    git clone <your-repository-url>
    cd <your-project-directory>
    ```
2.  **Deploy the Backend (`server/`)**:
    *   Navigate to the server directory: `cd server`
    *   Install dependencies: `npm install`
    *   Build the code (compile TypeScript to JavaScript): `npm run build`
    *   Start the server with PM2: `pm2 start dist/index.js --name api-backend` (assuming your build output is in `dist/index.js`).

3.  **Deploy the Frontend (`client/`)**:
    *   **IMPORTANT**: Before building, you must update the API URL. The file `client/src/services/api.ts` has the URL hardcoded to `http://localhost:8080/api`. You must change this to your server's public IP address or domain name (e.g., `http://YOUR_SERVER_IP/api`).
    *   Navigate to the client directory: `cd ../client`
    *   Install dependencies: `npm install`
    *   Build the static files: `npm run build`

### 4. Configure Nginx as a Reverse Proxy

1.  **Create an Nginx Config File**:
    ```bash
    sudo nano /etc/nginx/sites-available/your-app
    ```
2.  **Add the following configuration**. This tells Nginx to serve your React app and forward any requests for `/api` to your backend server. Replace `your-project-directory` with the actual path.
    ```nginx
    server {
        listen 80;
        server_name YOUR_SERVER_IP_OR_DOMAIN;

        # Path to your React app's build folder
        root /home/your_user/your-project-directory/client/dist;
        index index.html;

        location / {
            try_files $uri /index.html;
        }

        # Forward API requests to the backend server
        location /api {
            proxy_pass http://localhost:8080;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_cache_bypass $http_upgrade;
        }
    }
    ```
3.  **Enable the Site**:
    ```bash
    sudo ln -s /etc/nginx/sites-available/your-app /etc/nginx/sites-enabled/
    sudo nginx -t # Test for syntax errors
    sudo systemctl restart nginx
    ```

After these steps, you should be able to access your application by visiting your server's public IP address in a web browser. For a production environment, you would also want to set up a domain name and enable HTTPS with an SSL certificate (using a tool like Certbot).
