import { useNavigate } from 'react-router-dom';
import React, { useState, useEffect, useRef } from 'react';
import { FiUser, FiChevronDown, FiLogOut, FiUserPlus } from 'react-icons/fi';
import api from '../service/api';


const TopNavbar = ({ setActivePage }) => {
  const [company, setCompany] = useState({ businessName: 'Company Name' });
  const [admin, setAdmin] = useState({ username: 'Admin' });
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

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


  // Close dropdown if clicked outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <header className="bg-gray-700  flex items-center justify-between px-6 py-1">
      {/* Left: Logo + Company Name */}
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-full border-2 border-gray-100 overflow-hidden shadow-sm">
          <img
            src={`http://localhost:5000${company.logoUrl}`}
            alt="Logo"
            className="w-full h-full object-cover text-xs text-white"
          />
        </div>
        <h1 className="text-xl font-semibold bg-clip-text text-transparent bg-gray-200">
          {company.businessName?.replace(/\b\w/g, char => char.toUpperCase())}
        </h1>
      </div>

      {/* Right: Profile Dropdown */}
      <div className="relative" ref={dropdownRef}>
        <div className="flex items-center px-3 py-1 cursor-pointer   rounded-lg transition-all duration-200 ease-in-out bg-white">

          {/* Clickable avatar + name to navigate */}
          <div
            className="flex items-center gap-3 flex-1"
           onClick={() => setActivePage('User Management')} 
          >
            {/* <div className="w-9 h-9  md:w-10 md:h-10  rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-semibold text-lg shadow-md flex-shrink-0">
              {admin.username?.charAt(0).toUpperCase() || 'A'}
            </div> */}
            <div className="text-left hidden sm:block">
              {/* <p className="text-xs font-semibold text-gray-800 whitespace-nowrap overflow-hidden text-ellipsis max-w-[120px]">
                {admin.username?.replace(/\b\w/g, c => c.toUpperCase()) || 'ADMIN'}
              </p> */}
              <p className="text-sm text-blue-500 flex items-center gap-1 p-1 rounded-md">
                <FiUser size={15} className='rounded-full bg-gradient-to-br from-blue-500 w-9 h-9  md:w-6 md:h-6 md:p-1 text-white to-indigo-600' /><span className='text-blue-600 bg-blue-100 px-2 rounded-md'>Admin</span>
              </p>
            </div>
          </div>

          {/* Chevron to toggle dropdown only */}
          <FiChevronDown
            onClick={(e) => {
              e.stopPropagation(); // Prevent avatar area navigation
              setDropdownOpen(!dropdownOpen);
            }}
            className={`text-gray-500 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''} cursor-pointer`}
          />
        </div>

        {/* Dropdown */}
        {dropdownOpen && (
          <div className="absolute right-0 mt-3 w-56 bg-white rounded-lg shadow-xl border border-gray-200 z-50 overflow-hidden animate-fade-in-down">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-semibold text-lg">
                {admin.username?.charAt(0).toUpperCase() || 'A'}
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">{admin.username?.replace(/\b\w/g, c => c.toUpperCase())}</p>
                <p className="text-xs text-gray-600">Administrator</p>
              </div>
            </div>
            <button
             onClick={() => setActivePage('Admin Management')}              
              className="w-full px-4 py-3 text-left text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 flex items-center gap-3 transition-colors duration-200"
            >
              <FiUserPlus size={18} className="text-blue-500" /> Create New Account
            </button>
          </div>
        )}
      </div>

    </header>
  );
};

export default TopNavbar;
