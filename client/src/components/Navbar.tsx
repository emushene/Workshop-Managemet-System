import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <nav className="bg-gray-800 text-white p-4 shadow-md">
      <div className="container mx-auto flex justify-between items-center">
        <Link to="/" className="text-xl font-bold">Workshop Pro</Link>
        <div className="flex items-center">
          <Link to="/jobs" className="text-white hover:text-gray-300 mr-4">Jobs</Link>
          <Link to="/customers" className="text-white hover:text-gray-300 mr-4">Customers</Link>
          <Link to="/inventory" className="text-white hover:text-gray-300 mr-4">Inventory</Link>
          <Link to="/service-item-parts" className="text-white hover:text-gray-300 mr-4">Service Parts</Link>
          <Link to="/pos" className="text-white hover:text-gray-300 mr-4">POS</Link>
          <Link to="/invoices" className="text-white hover:text-gray-300 mr-4">Invoices</Link>
          {user.role === 'admin' && <Link to="/admin" className="text-white hover:text-gray-300 mr-4">Admin</Link>}
          <span className="mr-4">Welcome, {user.username || 'Guest'}</span>
          <button 
            onClick={handleLogout} 
            className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded">
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
