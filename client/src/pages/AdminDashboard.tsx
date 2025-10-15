import React, { useState, useEffect } from 'react';
import { getJobs, getInvoices, getServiceItemParts } from '../services/api';
const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const [jobsResponse, invoicesResponse, serviceItemPartsResponse] = await Promise.all([
          getJobs(),
          getInvoices(),
          getServiceItemParts(),
        ]);

        const jobs = jobsResponse.data.data;
        const invoices = invoicesResponse.data.data;
        const serviceItemParts = serviceItemPartsResponse.data.data;

        const totalRevenue = invoices.reduce((acc: number, inv: any) => acc + inv.totalAmount, 0);
        const jobsThisMonth = jobs.filter((job: any) => new Date(job.dateBookedIn).getMonth() === new Date().getMonth()).length;

        // A simple way to find the most popular service
        const serviceItemPartCounts: { [key: string]: number } = {};
        jobs.forEach((job: any) => {
          const serviceItemPart = serviceItemParts.find((part: any) => part.common_services === job.serviceDescription);
          if (serviceItemPart) {
            serviceItemPartCounts[serviceItemPart.part_name] = (serviceItemPartCounts[serviceItemPart.part_name] || 0) + 1;
          }
        });
        const popularService = Object.keys(serviceItemPartCounts).reduce((a, b) => serviceItemPartCounts[a] > serviceItemPartCounts[b] ? a : b, '');


        setStats({
          totalJobs: jobs.length,
          totalRevenue,
          jobsThisMonth,
          popularService,
          serviceItemParts
        });
      } catch (err) {
        setError('Failed to fetch dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) return <div className="p-4">Loading...</div>;
  if (error) return <div className="p-4 text-red-500">{error}</div>;
  if (!stats) return <div className="p-4">No data available.</div>;

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white shadow-md rounded-lg p-6 text-center">
          <h2 className="text-xl font-bold mb-2">Total Jobs</h2>
          <p className="text-4xl">{stats.totalJobs}</p>
        </div>
        <div className="bg-white shadow-md rounded-lg p-6 text-center">
          <h2 className="text-xl font-bold mb-2">Total Revenue</h2>
          <p className="text-4xl">R{stats.totalRevenue.toFixed(2)}</p>
        </div>
        <div className="bg-white shadow-md rounded-lg p-6 text-center">
          <h2 className="text-xl font-bold mb-2">Jobs This Month</h2>
          <p className="text-4xl">{stats.jobsThisMonth}</p>
        </div>
        <div className="bg-white shadow-md rounded-lg p-6 text-center">
          <h2 className="text-xl font-bold mb-2">Popular Service</h2>
          <p className="text-2xl">{stats.popularService}</p>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
