import express from 'express';
import cors from 'cors';
import path from 'path';
import db from './database';
import setupDatabase from './setupDatabase';

// Run database setup
setupDatabase();

// Import routes
import authRoutes from './routes/authRoutes';
import customerRoutes from './routes/customerRoutes';
import inventoryRoutes from './routes/inventoryRoutes';
import invoiceRoutes from './routes/invoiceRoutes';
import jobRoutes from './routes/jobRoutes';
import posRoutes from './routes/posRoutes';
import salesRoutes from './routes/salesRoutes';
import serviceItemPartsRoutes from './routes/serviceItemPartsRoutes';
import vehicleRoutes from './routes/vehicleRoutes';

const app = express();
const PORT = process.env.PORT || 8080;

// Middleware
app.use(cors());
app.use(express.json());

// Use routes
app.use('/api/auth', authRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/pos', posRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/service-item-parts', serviceItemPartsRoutes);
app.use('/api/vehicles', vehicleRoutes);

// Serve frontend in production
if (process.env.NODE_ENV === 'production') {
    const clientBuildPath = path.join(__dirname, '..', 'public');
    app.use(express.static(clientBuildPath));

    // The "catchall" handler for client-side routing
    app.get('*', (req, res) => {
        if (!req.path.startsWith('/api/')) {
            res.sendFile(path.join(clientBuildPath, 'index.html'));
        }
    });
} else {
    // Root route for development
    app.get('/', (req, res) => {
        res.send('API is running in development mode...');
    });
}

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
