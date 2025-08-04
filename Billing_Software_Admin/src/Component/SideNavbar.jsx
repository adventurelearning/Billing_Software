import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiHome, FiCreditCard, FiUsers, FiPackage, FiFileText, FiArchive,
  FiDollarSign, FiPieChart, FiSettings, FiUser, FiCloud,
  FiChevronLeft, FiChevronRight, FiLogOut
} from 'react-icons/fi';
import { GiExpense, GiProfit } from "react-icons/gi";
import api from '../service/api';

// NavItem component for individual navigation links
const NavItem = ({ icon: Icon, label, active, onClick, collapsed }) => (
  <li
    className={`w-full flex items-center p-3 rounded-lg cursor-pointer transition-all duration-200 ease-in-out
      ${active ? 'bg-gray-600 text-white shadow-md' : 'text-gray-200 '}
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
  const [collapsed, setCollapsed] = useState(false);
  const [company, setCompany] = useState({ businessName: 'Company Name' });
  const [admin, setAdmin] = useState({});

  useEffect(() => {
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
  }, []);

  // Define navigation items
  const navItems = [
    { icon: FiHome, label: 'Dashboard' },
    { icon: FiCreditCard, label: 'Billing / Invoices' },
    { icon: FiUsers, label: 'Customers' },
    { icon: FiCloud, label: 'Credit Dues' },
    { icon: FiPackage, label: 'Products' },
    { icon: FiArchive, label: 'Product Stock List' },
    { icon: FiDollarSign, label: 'Stock Summary' },
    { icon: GiProfit, label: 'ProfitReport' },
    { icon: GiExpense, label: 'Expense Menu' },
    { icon: FiPieChart, label: 'Billing Reports' },
    { icon: FiPieChart, label: 'Seller Bills uploaded' },
    // { icon: FiSettings, label: 'Settings' },
    { icon: FiUser, label: 'Admin Management' },
  ];

  const handleLogout = () => {
    localStorage.clear(); // clear auth/session if needed
    navigate('/');
  };

  return (
    <aside className={`relative flex flex-col bg-gray-700 shadow-xl transition-all duration-300 ease-in-out ${collapsed ? 'w-20 items-center' : 'w-60'}`}>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto mt-2">
        <ul className="space-y-2 px-3 py-2">
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

          {/* Logout */}
          <li className="pt-3 border-t border-gray-400">
            <button
              onClick={handleLogout}
              className={`flex items-center justify-center w-full px-3 py-2 text-sm font-medium bg-red-600 text-white rounded-lg shadow-md hover:bg-red-700 transition duration-200 ease-in-out`}
              title="Logout"
            >
              <FiLogOut className={`text-lg ${collapsed ? '' : 'mr-2'}`} />
              {!collapsed && "Logout"}
            </button>
          </li>
        </ul>

        {/* Footer with company name */}
        {!collapsed && (
          <div className="text-xs text-gray-100  text-center">
            &copy; {new Date().getFullYear()} {company.businessName}
          </div>
        )}
      </nav>

      {/* Collapse/Expand Button */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className={`absolute top-1/2 -translate-y-1/2 z-10 p-2 rounded-full text-blue-600 bg-white shadow-lg  focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300 ${collapsed ? '-right-5' : '-right-5'}`}
        title={collapsed ? 'Expand' : 'Collapse'}
      >
        {collapsed ? <FiChevronRight size={20} /> : <FiChevronLeft size={20} />}
      </button>
    </aside>
  );
};

export default SideNavbar;
