# Project Setup Guide for Windows

This guide provides detailed instructions to set up and run the project on a Windows machine.

## 1. Prerequisites

Before you begin, ensure you have the following software installed:

*   **Node.js and npm:** Download the latest LTS version from [nodejs.org](https://nodejs.org/). npm (Node Package Manager) is installed automatically with Node.js.
*   **Git:** Download and install from [git-scm.com](https://git-scm.com/download/win).
*   **Code Editor:** A code editor like [Visual Studio Code](https://code.visualstudio.com/) is highly recommended.
*   **DB Browser for SQLite (Optional):** Useful for inspecting the database. Download from [sqlitebrowser.org](https://sqlitebrowser.org/dl/).

## 2. Project Setup

Follow these steps to get the project files and install dependencies:

1.  **Clone the Repository:**
    Open your Git Bash or Command Prompt and run:
    ```bash
    git clone <repository_url>
    cd workproj
    ```
    (Replace `<repository_url>` with the actual URL of your Git repository.)

2.  **Install Server Dependencies:**
    Navigate into the `server` directory and install its dependencies:
    ```bash
    cd server
    npm install
    cd ..
    ```

3.  **Install Client Dependencies:**
    Navigate into the `client` directory and install its dependencies:
    ```bash
    cd client
    npm install
    cd ..
    ```

## 3. Database Setup

The project uses SQLite for its database. You need to initialize and potentially seed it with initial data.

1.  **Initialize the Database:**
    From the project root (`workproj` directory), run the database setup script:
    ```bash
    npm run setup-db --prefix server
    ```
    This command will create the `database.sqlite` file in the `server` directory and define the necessary tables.

2.  **Seed Initial Data (Optional):**
    If you need initial data for testing or demonstration, run the seed script:
    ```bash
    npm run seed-db --prefix server
    ```
    This will populate the database with some sample records.

## 4. Running the Application

You need to start both the server (backend) and the client (frontend) applications.

1.  **Start the Server:**
    Open a new Command Prompt or Git Bash window. Navigate to the project root (`workproj` directory) and run:
    ```bash
    npm start --prefix server
    ```
    The server will typically run on `http://localhost:8080`.

2.  **Start the Client (Development Mode):**
    Open another new Command Prompt or Git Bash window. Navigate to the project root (`workproj` directory) and run:
    ```bash
    npm run dev --prefix client
    ```
    The client application will typically open in your browser at `http://localhost:5173` (or another available port).

## 5. Building for Production (Optional)

To create a production-ready build of the client application:

1.  **Build the Client:**
    From the project root (`workproj` directory), run:
    ```bash
    npm run build --prefix client
    ```
    This will create a `dist` folder inside the `client` directory containing the optimized production build.

2.  **Serving the Production Build:**
    You can serve this `dist` folder using a simple static file server (e.g., `serve` npm package) or by configuring your backend server to serve these static files.

    To use `serve`:
    ```bash
    npm install -g serve
    serve -s client/dist
    ```
    Then access the application via the address provided by the `serve` command (e.g., `http://localhost:3000`).

## 6. Troubleshooting

*   **"Address already in use" error:** If you get this error when starting the server or client, it means another process is already using the required port. You can either stop the other process or configure the application to use a different port.
*   **Missing dependencies:** If you encounter errors about missing modules, ensure you have run `npm install` in both the `server` and `client` directories.
*   **Database not found:** Ensure you have run `npm run setup-db --prefix server` to create the `database.sqlite` file.
*   **Frontend not connecting to backend:** Check the `API_URL` in `client/src/services/api.ts` to ensure it points to the correct server address (`http://localhost:8080`).

If you encounter any other issues, please refer to the project's `README.md` or consult with the development team.
