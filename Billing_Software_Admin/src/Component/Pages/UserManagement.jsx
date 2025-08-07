import React, { useEffect, useState } from "react";
import { FiEdit, FiTrash2, FiUser, FiUserX, FiEye, FiEyeOff } from "react-icons/fi";
import api from "../../service/api";

const UserManagement = ({ setActivePage }) => {
  const [latestCompany, setLatestCompany] = useState(null);
  const [admin, setAdmin] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPasswords, setShowPasswords] = useState({});

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        const [companyRes, adminRes, userRes] = await Promise.all([
          api.get("/companies"),
          api.get("/credentials/admin"),
          api.get("/credentials/users")
        ]);

        const sortedCompanies = companyRes.data.sort(
          (a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)
        );
        setLatestCompany(sortedCompanies[0] || null);
        setAdmin(adminRes.data);
        setUsers(userRes.data || []);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, []);

  const togglePasswordVisibility = (userId) => {
    setShowPasswords(prev => ({
      ...prev,
      [userId]: !prev[userId]
    }));
  };

 const handleDelete = async (id) => {
  if (window.confirm("Are you sure you want to delete this cashier?")) {
    try {
      await api.delete(`/credentials/users/${id}`);
      setUsers(users.filter(u => u._id !== id));
      // Optional: Show success message
      alert("Cashier deleted successfully");
    } catch (error) {
      console.error("Error deleting user:", error);
      alert("Failed to delete cashier. Please try again.");
    }
  }
};

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>
  );

  return (
    <div className="space-y-4 bg-gray-50 min-h-screen p-4">
      {/* Admin Info Section */}
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Admin Credentials Card */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden w-full lg:w-1/4">
          <div className="bg-blue-100 p-4 text-black flex justify-between items-center">
            <h2 className="text-lg font-semibold">Admin Credentials</h2>
            <button
              onClick={() => setActivePage('Admin Management')}
              className="p-2 bg-white text-blue-600 rounded-md hover:bg-blue-50 shadow-sm"
            >
              <FiEdit className="text-lg" />
            </button>
          </div>

          <div className="p-4 flex flex-col items-center">
            <div className="mb-4">
              <FiUser className="w-16 h-16 p-1 text-blue-600 bg-blue-50 rounded-full border-2 border-blue-100" />
            </div>

            <div className="text-center w-full">
              {admin ? (
                <>
                  <div className="mb-2">
                    <label className="block text-sm font-medium text-gray-500">Admin</label>
                    <p className="text-lg font-bold text-black">
                      {admin.username?.replace(/\b\w/g, char => char.toUpperCase())}
                    </p>
                  </div>

                  <div className="mb-2">
                    <label className="block text-sm font-medium text-gray-500">Contact</label>
                    <p className="text-sm font-medium text-blue-600">
                      +91 {admin.contactNumber}
                    </p>
                  </div>

                  <div className="relative">
                    <label className="block text-sm font-medium text-gray-500">Password</label>
                    <div className="flex items-center justify-center">
                      {showPasswords.admin ? (
                        <>
                          <p className="text-sm font-mono">{admin.password}</p>
                          <button 
                            onClick={() => togglePasswordVisibility('admin')}
                            className="ml-2 text-gray-500 hover:text-gray-700"
                          >
                            <FiEyeOff className="text-lg" />
                          </button>
                        </>
                      ) : (
                        <>
                          <p className="text-sm font-mono">••••••••</p>
                          <button 
                            onClick={() => togglePasswordVisibility('admin')}
                            className="ml-2 text-gray-500 hover:text-gray-700"
                          >
                            <FiEye className="text-lg" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <p className="text-gray-500">No admin credentials available</p>
              )}
            </div>
          </div>
        </div>

        {/* Company Info Card */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden w-full lg:w-3/4">
          <div className="bg-blue-100 p-4 text-black flex justify-between items-center">
            <h2 className="text-lg font-semibold">Company Information</h2>
            <button
              onClick={() => setActivePage('Admin Management')}
              className="p-2 bg-white text-blue-600 rounded-md hover:bg-blue-50 shadow-sm"
            >
              <FiEdit className="text-lg" />
            </button>
          </div>

          <div className="p-4 md:p-6 grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            {latestCompany ? (
              <>
                <div className="space-y-3">
                  <div className="flex items-center">
                    {latestCompany.logoUrl && (
                      <img
                        src={latestCompany.logoUrl}
                        alt="Company Logo"
                        className="w-12 h-12 md:w-16 md:h-16 object-contain rounded-md border mr-3"
                      />
                    )}
                    <p className="text-lg font-semibold">
                      {latestCompany.businessName?.replace(/\b\w/g, char => char.toUpperCase())}
                    </p>
                  </div>
                  <div>
                    <label className="block text-xs md:text-sm font-medium text-gray-500">Address</label>
                    <p className="text-sm md:text-base text-black font-medium">
                      {latestCompany.address}, {latestCompany.state} - {latestCompany.pincode}
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs md:text-sm font-medium text-gray-500">GSTIN</label>
                    <p className="text-sm md:text-base font-medium">{latestCompany.gstin}</p>
                  </div>
                  <div>
                    <label className="block text-xs md:text-sm font-medium text-gray-500">Phone</label>
                    <p className="text-sm md:text-base font-medium">{latestCompany.phoneNumber}</p>
                  </div>
                  <div>
                    <label className="block text-xs md:text-sm font-medium text-gray-500">Email</label>
                    <p className="text-sm md:text-base font-medium">{latestCompany.email}</p>
                  </div>
                </div>
              </>
            ) : (
              <p className="text-gray-500">No company information available</p>
            )}
          </div>
        </div>
      </div>

      {/* Cashier Users Section */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="bg-blue-100 p-4 text-black flex justify-between items-center">
          <h2 className="text-lg font-semibold">Cashier Users</h2>
          {users.length > 0 && (
            <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded">
              {users.length} {users.length === 1 ? 'cashier' : 'cashiers'}
            </span>
          )}
        </div>

        <div className="p-4">
          {users.length > 0 ? (
            <div className="space-y-3">
              {users.map((user) => (
                <div
                  key={user._id}
                  className="border border-gray-200 rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    {/* User Info */}
                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <h3 className="text-base font-semibold text-gray-800">
                          {user.cashierName?.replace(/\b\w/g, char => char.toUpperCase())}
                        </h3>
                        <p className="text-xs text-gray-500">ID: {user.cashierId}</p>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-500">Counter</label>
                        <p className="text-sm text-gray-700">{user.counterNum || '-'}</p>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-500">Contact</label>
                        <p className="text-sm text-gray-700">{user.contactNumber}</p>
                      </div>
                    </div>

                    {/* Password with toggle and Delete Button */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-6 p-2">
                      <div className="sm:text-right">
                        <label className="block text-xs font-medium text-gray-500">Password</label>
                        <div className="flex items-center justify-end">
                          {showPasswords[user._id] ? (
                            <>
                              <span className="text-sm font-mono">{user.password}</span>
                              <button 
                                onClick={() => togglePasswordVisibility(user._id)}
                                className="ml-1 text-gray-500 hover:text-gray-700"
                              >
                                <FiEyeOff className="text-sm" />
                              </button>
                            </>
                          ) : (
                            <>
                              <span className="text-sm font-mono">••••••••</span>
                              <button 
                                onClick={() => togglePasswordVisibility(user._id)}
                                className="ml-1 text-gray-500 hover:text-gray-700"
                              >
                                <FiEye className="text-sm" />
                              </button>
                            </>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={() => handleDelete(user._id)}
                        className="p-2 bg-red-100 text-red-600 rounded-md hover:bg-red-200 transition-colors self-end sm:self-auto"
                        title="Delete"
                      >
                        <FiTrash2 className="text-base" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6">
              <FiUserX className="mx-auto h-10 w-10 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No cashier users</h3>
              <p className="mt-1 text-xs text-gray-500">Get started by adding a new cashier.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserManagement;