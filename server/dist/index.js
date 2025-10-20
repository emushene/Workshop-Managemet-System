"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const path_1 = __importDefault(require("path"));
const setupDatabase_1 = __importDefault(require("./setupDatabase"));
// Run database setup
(0, setupDatabase_1.default)();
// Import routes
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const customerRoutes_1 = __importDefault(require("./routes/customerRoutes"));
const inventoryRoutes_1 = __importDefault(require("./routes/inventoryRoutes"));
const invoiceRoutes_1 = __importDefault(require("./routes/invoiceRoutes"));
const jobRoutes_1 = __importDefault(require("./routes/jobRoutes"));
const posRoutes_1 = __importDefault(require("./routes/posRoutes"));
const salesRoutes_1 = __importDefault(require("./routes/salesRoutes"));
const serviceItemPartsRoutes_1 = __importDefault(require("./routes/serviceItemPartsRoutes"));
const vehicleRoutes_1 = __importDefault(require("./routes/vehicleRoutes"));
const app = (0, express_1.default)();
const PORT = process.env.PORT || 8080;
// Middleware
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// Use routes
app.use('/api/auth', authRoutes_1.default);
app.use('/api/customers', customerRoutes_1.default);
app.use('/api/inventory', inventoryRoutes_1.default);
app.use('/api/invoices', invoiceRoutes_1.default);
app.use('/api/jobs', jobRoutes_1.default);
app.use('/api/pos', posRoutes_1.default);
app.use('/api/sales', salesRoutes_1.default);
app.use('/api/service-item-parts', serviceItemPartsRoutes_1.default);
app.use('/api/vehicles', vehicleRoutes_1.default);
// Serve frontend in production
if (process.env.NODE_ENV === 'production') {
    const clientBuildPath = path_1.default.join(__dirname, '..', 'public');
    app.use(express_1.default.static(clientBuildPath));
    // The "catchall" handler for client-side routing
    app.get('*', (req, res) => {
        if (!req.path.startsWith('/api/')) {
            res.sendFile(path_1.default.join(clientBuildPath, 'index.html'));
        }
    });
}
else {
    // Root route for development
    app.get('/', (req, res) => {
        res.send('API is running in development mode...');
    });
}
// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
