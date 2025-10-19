import axios from 'axios';

const API_URL = 'http://localhost:8080/api';

const api = axios.create({
  baseURL: API_URL,
});

// Add a request interceptor to include the token in headers
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Auth
export const login = (credentials: any) => api.post('/auth/login', credentials);

// Customers
export const getCustomers = () => api.get('/customers');
export const getCustomer = (id: number) => api.get(`/customers/${id}`);
export const createCustomer = (data: any) => api.post('/customers', data);
export const updateCustomer = (id: number, data: any) => api.put(`/customers/${id}`, data);
export const deleteCustomer = (id: number) => api.delete(`/customers/${id}`);

// Jobs
export const getJobs = () => api.get('/jobs');
export const getJob = (id: number) => api.get(`/jobs/${id}`);
export const getJobCardData = (id: number) => api.get(`/jobs/${id}/job-card`);
export const createJob = async (data: any) => {
    const response = await api.post('/jobs', data);
    return response.data; // Return the full response data
};
export const updateJob = (id: number, data: any) => api.put(`/jobs/${id}`, data);
export const deleteJob = (id: number) => api.delete(`/jobs/${id}`);

// Procured Parts
export const addProcuredPartToJob = (jobId: number, partData: any) => api.post(`/jobs/${jobId}/procured-parts`, partData);
export const getProcuredPartsForJob = (jobId: number) => api.get(`/jobs/${jobId}/procured-parts`);
export const deleteProcuredPart = (partId: number) => api.delete(`/procured-parts/${partId}`);

// Inventory
export const getInventory = () => api.get('/inventory');
export const getInventoryItem = (id: number) => api.get(`/inventory/${id}`);
export const createInventoryItem = (data: any) => api.post('/inventory', data);
export const updateInventoryItem = (id: number, data: any) => api.put(`/inventory/${id}`, data);
export const deleteInventoryItem = (id: number) => api.delete(`/inventory/${id}`);

// Service Item Parts
export const getServiceItemParts = () => api.get('/service-item-parts');
export const getServiceItemPart = (id: number) => api.get(`/service-item-parts/${id}`);
export const createServiceItemPart = (data: any) => api.post('/service-item-parts', data);
export const updateServiceItemPart = (id: number, data: any) => api.put(`/service-item-parts/${id}`, data);
export const deleteServiceItemPart = (id: number) => api.delete(`/service-item-parts/${id}`);

// Vehicles
export const getVehicles = () => api.get('/vehicles');

// Invoices
export const getInvoices = () => api.get('/invoices');
export const getInvoice = (id: number) => api.get(`/invoices/${id}`);
export const getInvoiceByJobId = (jobId: number) => api.get(`/invoices?jobId=${jobId}`);
export const createInvoice = (data: any) => api.post('/invoices', data);

// Sales
export const getSales = () => api.get('/sales');
export const getSale = (id: number) => api.get(`/sales/${id}`);
export const createSale = (data: any) => api.post('/sales', data);

// Payments
export const createPayment = (data: any) => api.post('/pos/payments', data);

export default api;
