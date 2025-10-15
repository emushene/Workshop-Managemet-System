# Vehicle Service Workshop - Development Plan

This file outlines the tasks to build the full-stack workshop management application.

## Phase 1: Project Setup & Backend Foundation

- [ ] Initialize project structure (`client` and `server` directories).
- [ ] **Server:** Initialize Node.js/TypeScript project.
- [ ] **Server:** Install backend dependencies (Express, SQLite, CORS, TypeScript, etc.).
- [ ] **Server:** Set up `tsconfig.json` for the backend.
- [ ] **Server:** Create `database.ts` to define and initialize the SQLite database.
- [ ] **Server:** Define core data schemas:
    - `Customers` (name, contact)
    - `Jobs` (customer, itemDescription, serviceDescription, jobType: ['PART', 'VEHICLE'], status)
    - `Inventory` (name, quantity, price)
    - `Invoices` (linked to job, line items, total)
    - `Users` (for authentication)
- [ ] **Server:** Create a `seed.ts` script to populate initial data (e.g., sample services, admin user).

## Phase 2: Backend API Development

- [ ] **API:** Implement User Authentication endpoints (login).
- [ ] **API:** Implement CRUD endpoints for Customers.
- [ ] **API:** Implement CRUD endpoints for Jobs.
- [ ] **API:** Implement CRUD endpoints for Inventory.
- [ ] **API:** Implement endpoints for creating and managing Invoices from Jobs.
- [ ] **API:** Develop the Point of Sale (POS) logic to finalize jobs and create invoices.

## Phase 3: Frontend Scaffolding & Core UI

- [ ] **Client:** Initialize React/TypeScript project (using Vite).
- [ ] **Client:** Install frontend dependencies (React Router, Axios, Tailwind CSS).
- [ ] **Client:** Configure Tailwind CSS.
- [ ] **Client:** Set up project structure (`pages`, `components`, `services`).
- [ ] **Client:** Implement basic routing (`App.tsx`).
- [ ] **Client:** Create a global layout component with navigation.
- [ ] **Client:** Create an API service module to communicate with the backend.

## Phase 4: Frontend Feature Implementation

- [x] **UI:** Build the Login page.
- [x] **UI:** Build the main Jobs Dashboard to display and filter all jobs.
- [x] **UI:** Build the form for booking a new job (for parts or vehicles).
- [x] **UI:** Build the Job Detail page to show progress, add notes, and use inventory items.
- [x] **UI:** Build the Customer Management page.
- [x] **UI:** Build the Inventory Management page.
- [x] **UI:** Build the Point of Sale (POS) interface for invoicing.
- [x] **UI:** Build the Invoice/Receipt view for printing.
- [x] **UI:** Create an Admin Dashboard with key metrics.

## Phase 5: Finalization & Polish

- [ ] Conduct end-to-end testing of the user flow.
- [ ] Refine UI/UX for a polished, modern feel.
- [ ] Add final touches (loading states, error handling).
- [ ] Create a `README.md` with setup and run instructions.
