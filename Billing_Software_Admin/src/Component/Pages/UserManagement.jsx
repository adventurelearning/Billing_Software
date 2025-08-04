import React, { useEffect, useState } from "react";
import { FiEdit, FiTrash2, FiSave, FiX, FiUser, FiBriefcase, FiCreditCard, FiUserX } from "react-icons/fi";
import api from "../../service/api";

const UserManagement = ({ setActivePage }) => {
  const [latestCompany, setLatestCompany] = useState(null);
  const [admin, setAdmin] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState({
    company: false,
    admin: false,
    users: {}
  });
  const [formData, setFormData] = useState({
    company: {},
    admin: {},
    users: {}
  });

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
        setFormData(prev => ({ ...prev, company: sortedCompanies[0] || {} }));

        setAdmin(adminRes.data);
        setFormData(prev => ({ ...prev, admin: adminRes.data || {} }));

        const usersData = userRes.data || [];
        setUsers(usersData);
        setFormData(prev => ({
          ...prev,
          users: usersData.reduce((acc, user) => ({ ...acc, [user._id]: user }), {})
        }));
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, []);

  const handleEdit = (type, id = null) => {
    if (type === 'company') {
      setEditing({ ...editing, company: true });
    } else if (type === 'admin') {
      setEditing({ ...editing, admin: true });
    } else {
      setEditing({ ...editing, users: { ...editing.users, [id]: true } });
    }
  };

  const handleCancel = (type, id = null) => {
    if (type === 'company') {
      setEditing({ ...editing, company: false });
      setFormData(prev => ({ ...prev, company: latestCompany || {} }));
    } else if (type === 'admin') {
      setEditing({ ...editing, admin: false });
      setFormData(prev => ({ ...prev, admin: admin || {} }));
    } else {
      setEditing({ ...editing, users: { ...editing.users, [id]: false } });
      setFormData(prev => ({
        ...prev,
        users: { ...prev.users, [id]: users.find(u => u._id === id) || {} }
      }));
    }
  };

  const handleChange = (e, type, id = null) => {
    const { name, value } = e.target;
    if (type === 'company') {
      setFormData(prev => ({
        ...prev,
        company: { ...prev.company, [name]: value }
      }));
    } else if (type === 'admin') {
      setFormData(prev => ({
        ...prev,
        admin: { ...prev.admin, [name]: value }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        users: {
          ...prev.users,
          [id]: { ...prev.users[id], [name]: value }
        }
      }));
    }
  };

  const handleSave = async (type, id = null) => {
    try {
      if (type === 'company') {
        await api.put(`/companies/${latestCompany._id}`, formData.company);
        setLatestCompany(formData.company);
        setEditing({ ...editing, company: false });
      } else if (type === 'admin') {
        await api.put(`/credentials/admin/${admin._id}`, formData.admin);
        setAdmin(formData.admin);
        setEditing({ ...editing, admin: false });
      } else {
        await api.put(`/credentials/users/${id}`, formData.users[id]);
        setUsers(users.map(u => u._id === id ? formData.users[id] : u));
        setEditing({ ...editing, users: { ...editing.users, [id]: false } });
      }
    } catch (error) {
      console.error(`Error updating ${type}:`, error);
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/credentials/users/${id}`);
      setUsers(users.filter(u => u._id !== id));
    } catch (error) {
      console.error("Error deleting user:", error);
    }
  };

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>
  );

  return (
    <div className="space-y-4 bg-gray-50 min-h-screen ">
      {/* Admin Info Card */}
      <div className="flex justify-between gap-4">
        {/* Admin Credentials Card - 1/4 width */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden w-1/4 flex flex-col">
          {/* Header with title and edit button */}
          <div className="bg-blue-100 p-4 text-black flex justify-between items-center">
            <h2 className="text-lg font-semibold">Admin Credentials</h2>
            <button
              onClick={() => setActivePage('Admin Management')}
              className="p-2 bg-white text-blue-600 rounded-md hover:bg-blue-50 shadow-sm"
            >
              <FiEdit className="text-lg" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 p-4 flex flex-col items-center">
            {/* Centered user icon */}
            <div className="mb-4">
              <FiUser className="w-20 h-20 p-1 text-blue-600 bg-blue-50 rounded-full border-2 border-blue-100" />
            </div>

            {/* User details */}
            <div className="text-center w-full">
              {admin ? (
                <>
                  <div className="mb-1">
                    <label className="block text-sm font-medium text-gray-500">Admin</label>
                    <p className="text-xl text-black font-bold mt-1">
                      {admin.username?.replace(/\b\w/g, char => char.toUpperCase())}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-blue-600">
                      +91 {admin.contactNumber}
                    </p>
                  </div>
                </>
              ) : (
                <p className="text-gray-500">No admin credentials available</p>
              )}
            </div>
          </div>
        </div>

        {/* Company Info Card - 3/4 width */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden w-3/4">
          <div className="bg-blue-100  p-4 text-black flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <h2 className="text-lg font-semibold">Company Information</h2>
            </div>
            <button
              onClick={() => setActivePage('Admin Management')}
              className="p-2 bg-white text-blue-600 rounded-md hover:bg-blue-50 shadow-sm"
            >
              <FiEdit className="text-lg" />
            </button>
          </div>

          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            {latestCompany ? (
              <>
                <div className="space-y-4">
                  <div>  {latestCompany.logoUrl && (
                    <div className="flex items-center ">
                      <img
                        src={latestCompany.logoUrl}
                        alt="Company Logo"
                        className="w-16 h-16 object-contain rounded-md border"
                      />
                    </div>
                  )}
                    {/* <label className="block text-sm font-medium text-gray-500">Business Name</label> */}
                    <p className="mt-1 text-lg font-semibold">{latestCompany.businessName?.replace(/\b\w/g, char => char.toUpperCase())}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Address</label>
                    <p className="mt-1 text-black text-base font-medium w-3/4">
                      {latestCompany.address}, {latestCompany.state} - {latestCompany.pincode}
                    </p>
                  </div>
                </div>

                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-500">GSTIN</label>
                    <p className="mt-1 text-base font-medium">{latestCompany.gstin}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Phone</label>
                    <p className="mt-1 text-base font-medium">{latestCompany.phoneNumber}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Email</label>
                    <p className="mt-1 text-base font-medium">{latestCompany.email}</p>
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
        {/* Header */}
        <div className="bg-blue-100  p-4 text-black flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <h2 className="text-lg font-semibold">Cashier Users</h2>
          </div>
          {users.length > 0 && (
            <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded">
              {users.length} {users.length === 1 ? 'cashier' : 'cashiers'}
            </span>
          )}
        </div>

        {/* Content */}
        <div className="p-6">
          {users.length > 0 ? (
            <div className="space-y-4">
              {users.map((user) => (
                <div
                  key={user._id}
                  className="border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow duration-200"
                >
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    {/* User Info */}
                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-800">{user.cashierName?.replace(/\b\w/g, char => char.toUpperCase())}</h3>
                        <p className="text-sm text-gray-500">ID: {user.cashierId}</p>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Counter Number</label>
                        {editing.users[user._id] ? (
                          <input
                            type="text"
                            name="counterNum"
                            value={formData.users[user._id]?.counterNum || ''}
                            onChange={(e) => handleChange(e, 'user', user._id)}
                            className="w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 text-sm p-2 border"
                          />
                        ) : (
                          <p className="text-sm text-gray-700">{user.counterNum}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Contact Number</label>
                        {editing.users[user._id] ? (
                          <input
                            type="text"
                            name="contactNumber"
                            value={formData.users[user._id]?.contactNumber || ''}
                            onChange={(e) => handleChange(e, 'user', user._id)}
                            className="w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 text-sm p-2 border"
                          />
                        ) : (
                          <p className="text-sm text-gray-700">{user.contactNumber}</p>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-end gap-2">
                      {editing.users[user._id] ? (
                        <>
                          <button
                            onClick={() => handleSave('user', user._id)}
                            className="p-2 bg-green-100 text-green-600 rounded-md hover:bg-green-200 transition-colors"
                            title="Save"
                          >
                            <FiSave className="text-lg" />
                          </button>
                          <button
                            onClick={() => handleCancel('user', user._id)}
                            className="p-2 bg-red-100 text-red-600 rounded-md hover:bg-red-200 transition-colors"
                            title="Cancel"
                          >
                            <FiX className="text-lg" />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => handleEdit('user', user._id)}
                            className="p-2 bg-blue-100 text-blue-600 rounded-md hover:bg-blue-200 transition-colors"
                            title="Edit"
                          >
                            <FiEdit className="text-lg" />
                          </button>
                          <button
                            onClick={() => handleDelete(user._id)}
                            className="p-2 bg-red-100 text-red-600 rounded-md hover:bg-red-200 transition-colors"
                            title="Delete"
                          >
                            <FiTrash2 className="text-lg" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <FiUserX className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No cashier users</h3>
              <p className="mt-1 text-sm text-gray-500">Get started by adding a new cashier.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
export default UserManagement;