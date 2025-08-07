import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiHome, FiCreditCard, FiUsers, FiPackage,  FiArchive,
  FiDollarSign, FiPieChart, FiUser, 
  FiChevronLeft, FiChevronRight, FiLogOut, FiUpload,  
} from 'react-icons/fi';
import { BsCreditCard } from "react-icons/bs";
import { MdOutlineInventory, MdAssessment } from "react-icons/md";
import api from '../service/api';

// NavItem component for individual navigation links
const NavItem = ({ icon: Icon, label, active, onClick, collapsed }) => (
  <li
    className={`w-full flex items-center p-3 rounded-lg cursor-pointer transition-all duration-200 ease-in-out
      ${active ? 'bg-gray-600 text-white shadow-md' : 'text-gray-200 hover:bg-gray-600'}
      ${collapsed ? 'justify-center' : ''}`}
    onClick={onClick}
    title={collapsed ? label : ''}
  >
    <Icon className={`text-xl ${collapsed ? '' : 'mr-3'}`} />
    {!collapsed && <span className="font-medium text-sm">{label}</span>}
  </li>
);

// SideNavbar component
const SideNavbar = ({ activeItem, setActivePage }) => {
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(window.innerWidth < 768); // Collapsed by default on mobile
  const [company, setCompany] = useState({ businessName: 'Company Name' });
  const [admin, setAdmin] = useState({});

  useEffect(() => {
    // Handle window resize
    const handleResize = () => {
      setCollapsed(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    
    api.get('/companies')
      .then(res => {
        if (res.data.length > 0) {
          setCompany(res.data[0]);
        }
      })
      .catch(err => console.error('Error fetching company data:', err));

    api.get('/credentials/admin')
      .then(res => {
        if (res.data) {
          setAdmin(res.data);
        }
      })
      .catch(err => console.error('Error fetching admin data:', err));

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Define navigation items
  const navItems = [
    { icon: FiHome, label: 'Dashboard' },
    { icon: MdAssessment, label: 'Billing Reports' },
    { icon: BsCreditCard, label: 'Credit Dues' },
    { icon: FiPackage, label: 'Products' },
    { icon: MdOutlineInventory, label: 'Product Stock List' },
    { icon: FiDollarSign, label: 'Stock Summary' },
    { icon: FiUpload, label: 'Seller Bills uploaded' },
    { icon: FiCreditCard, label: 'Billing / Invoices' },
    { icon: FiUsers, label: 'Customers' },
    { icon: FiPieChart, label: 'ProfitReport' },
    { icon: FiArchive, label: 'Expense Menu' },
    { icon: FiUser, label: 'Admin Management' },
  ];

  const handleLogout = () => {
    localStorage.clear(); // clear auth/session if needed
    navigate('/');
  };

  const toggleCollapse = () => {
    setCollapsed(!collapsed);
  };

  return (
<aside className={`relative flex flex-col bg-gray-700 shadow-xl transition-all duration-300 ease-in-out 
      ${collapsed ? 'w-16 md:w-20 items-center' : 'w-56'}`}>
      
      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto scrollbar-hide">
        <ul className="px-1 space-y-1">
          {navItems.map(({ icon, label }) => (
            <NavItem
              key={label}
              icon={icon}
              label={label}
              active={activeItem === label}
              onClick={() => setActivePage(label)}
              collapsed={collapsed}
            />
          ))}
        </ul>
      </nav>

      {/* Fixed bottom section */}
      <div className="mt-auto">
        {/* Logout */}
        <div className="pt-2 border-t border-gray-400 px-1">
          <button
            onClick={handleLogout}
            className={`flex items-center justify-center w-full px-3 py-2 text-sm font-medium bg-red-600 text-white rounded-lg shadow-md hover:bg-red-700 transition duration-200 ease-in-out
              ${collapsed ? 'px-0 py-3' : ''}`}
            title={collapsed ? "Logout" : ""}
          >
            <FiLogOut className={` text-sm sm:text-lg ${collapsed ? '' : 'mr-2'}`} />
            {!collapsed && "Logout"}
          </button>
        </div>

        {/* Footer with company name - only shown when not collapsed */}
        {!collapsed && (
          <div className="text-xs text-gray-100 text-center pb-1 mt-2 px-1">
            &copy; {new Date().getFullYear()} {company.businessName}
          </div>
        )}
      </div>

      {/* Collapse/Expand Button */}
      <button
        onClick={toggleCollapse}
        className={`absolute top-1/2 -translate-y-1/2 z-50 p-2 rounded-full text-blue-600 bg-white shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300 
          ${collapsed ? '-right-5' : '-right-5'}`}
        title={collapsed ? 'Expand' : 'Collapse'}
      >
        {collapsed ? <FiChevronRight size={20} /> : <FiChevronLeft size={20} />}
      </button>

      {/* Add CSS to hide scrollbar */}
      <style jsx>{`
        .scrollbar-hide {
          -ms-overflow-style: none;  /* IE and Edge */
          scrollbar-width: none;  /* Firefox */
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;  /* Chrome, Safari and Opera */
        }
      `}</style>
    </aside>
  );
};

export default SideNavbar;