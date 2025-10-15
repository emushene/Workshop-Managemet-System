import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import JobsDashboard from './pages/JobsDashboard';
import NewJobPage from './pages/NewJobPage';
import CustomerPage from './pages/CustomerPage';
import InventoryPage from './pages/InventoryPage';
import JobDetailPage from './pages/JobDetailPage';
import POSPage from './pages/POSPage';
import InvoicePage from './pages/InvoicePage';
import InvoiceDetailPage from './pages/InvoiceDetailPage';
import AdminDashboard from './pages/AdminDashboard';
import InvoicePrintPage from './pages/InvoicePrintPage';
import JobCardPrintPage from './pages/JobCardPrintPage';
import ServiceItemPartsPage from './pages/ServiceItemPartsPage';
import MainLayout from './pages/MainLayout';
import ProtectedRoute from './components/ProtectedRoute';


export default function App() {
  return (
    <Router>
      <div className="bg-gray-100 min-h-screen">
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route element={<ProtectedRoute />}>
            {/* Print routes are now outside of the MainLayout */}
            <Route path="/jobs/:id/print" element={<JobCardPrintPage />} />
            <Route path="/invoices/:id/print" element={<InvoicePrintPage />} />

            <Route element={<MainLayout />}>
              <Route path="/" element={<HomePage />} />
              <Route path="/jobs" element={<JobsDashboard />} />
              <Route path="/jobs/new" element={<NewJobPage />} />
              <Route path="/jobs/:id" element={<JobDetailPage />} />
              <Route path="/customers" element={<CustomerPage />} />
              <Route path="/inventory" element={<InventoryPage />} />
              <Route path="/service-item-parts" element={<ServiceItemPartsPage />} />
              <Route path="/pos" element={<POSPage />} />
              <Route path="/invoices" element={<InvoicePage />} />
              <Route path="/invoices/:id" element={<InvoiceDetailPage />} />
              <Route path="/invoices/generate/:id" element={<InvoiceDetailPage />} />
              <Route path="/admin" element={<AdminDashboard />} />
            </Route>
          </Route>
        </Routes>
      </div>
    </Router>
  );
}