import React, { useEffect, useState } from "react";
import { FiEdit, FiTrash2, FiUser, FiUserX, FiEye, FiEyeOff, FiSave, FiX } from "react-icons/fi";
import api from "../../service/api";

const UserManagement = ({ setActivePage }) => {
  const [latestCompany, setLatestCompany] = useState(null);
  const [admin, setAdmin] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPasswords, setShowPasswords] = useState({});
  const [isEditingCompany, setIsEditingCompany] = useState(false);
  const [formData, setFormData] = useState({
    businessName: "",
    phoneNumber: "",
    gstin: "",
    email: "",
    businessType: "",
    businessCategory: "",
    state: "",
    pincode: "",
    address: "",
    logoUrl: "",
    signatureUrl: ""
  });

  const fetchCompanyData = async () => {
    try {
      const companyRes = await api.get("/companies");
      const sortedCompanies = companyRes.data.sort(
        (a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)
      );
      const currentCompany = sortedCompanies[0] || null;
      setLatestCompany(currentCompany);
      
      if (currentCompany) {
        setFormData({
          businessName: currentCompany.businessName || "",
          phoneNumber: currentCompany.phoneNumber || "",
          gstin: currentCompany.gstin || "",
          email: currentCompany.email || "",
          businessType: currentCompany.businessType || "",
          businessCategory: currentCompany.businessCategory || "",
          state: currentCompany.state || "",
          pincode: currentCompany.pincode || "",
          address: currentCompany.address || "",
          logoUrl: currentCompany.logoUrl || "",
          signatureUrl: currentCompany.signatureUrl || ""
        });
      }
    } catch (error) {
      console.error("Error fetching company data:", error);
    }
  };

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        const [adminRes, userRes] = await Promise.all([
          api.get("/credentials/admin"),
          api.get("/credentials/users")
        ]);

        await fetchCompanyData();
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
        alert("Cashier deleted successfully");
      } catch (error) {
        console.error("Error deleting user:", error);
        alert("Failed to delete cashier. Please try again.");
      }
    }
  };

  const handleCompanyDelete = async () => {
    if (window.confirm("Are you sure you want to delete this company? This action cannot be undone.")) {
      try {
        await api.delete(`/companies/${latestCompany._id}`);
        setLatestCompany(null);
        alert("Company deleted successfully");
      } catch (error) {
        console.error("Error deleting company:", error);
        alert("Failed to delete company. Please try again.");
      }
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e) => {
    const { name, files } = e.target;
    if (files && files[0]) {
      const fileUrl = URL.createObjectURL(files[0]);
      setFormData(prev => ({
        ...prev,
        [name]: fileUrl
      }));
    }
  };

  const handleCompanyUpdate = async () => {
    try {
      // Create form data for file uploads
      const formDataToSend = new FormData();
      for (const key in formData) {
        if (key === 'logoUrl' || key === 'signatureUrl') {
          // Handle file inputs separately if needed
          continue;
        }
        formDataToSend.append(key, formData[key]);
      }

      // Send the update request
      const response = await api.put(`/companies/${latestCompany._id}`, formData);
      
      // Update local state with the response data
      setLatestCompany(response.data);
      setFormData({
        businessName: response.data.businessName || "",
        phoneNumber: response.data.phoneNumber || "",
        gstin: response.data.gstin || "",
        email: response.data.email || "",
        businessType: response.data.businessType || "",
        businessCategory: response.data.businessCategory || "",
        state: response.data.state || "",
        pincode: response.data.pincode || "",
        address: response.data.address || "",
        logoUrl: response.data.logoUrl || "",
        signatureUrl: response.data.signatureUrl || ""
      });
      
      setIsEditingCompany(false);
      alert("Company updated successfully");
    } catch (error) {
      console.error("Error updating company:", error);
      alert("Failed to update company. Please try again.");
    }
  };

  const cancelEdit = () => {
    if (latestCompany) {
      setFormData({
        businessName: latestCompany.businessName || "",
        phoneNumber: latestCompany.phoneNumber || "",
        gstin: latestCompany.gstin || "",
        email: latestCompany.email || "",
        businessType: latestCompany.businessType || "",
        businessCategory: latestCompany.businessCategory || "",
        state: latestCompany.state || "",
        pincode: latestCompany.pincode || "",
        address: latestCompany.address || "",
        logoUrl: latestCompany.logoUrl || "",
        signatureUrl: latestCompany.signatureUrl || ""
      });
    }
    setIsEditingCompany(false);
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
            <div className="flex gap-2">
              {!isEditingCompany && latestCompany && (
                <>
                  <button
                    onClick={() => setIsEditingCompany(true)}
                    className="p-2 bg-white text-blue-600 rounded-md hover:bg-blue-50 shadow-sm"
                  >
                    <FiEdit className="text-lg" />
                  </button>
                  <button
                    onClick={handleCompanyDelete}
                    className="p-2 bg-white text-red-600 rounded-md hover:bg-red-50 shadow-sm"
                  >
                    <FiTrash2 className="text-lg" />
                  </button>
                </>
              )}
              {isEditingCompany && (
                <>
                  <button
                    onClick={handleCompanyUpdate}
                    className="p-2 bg-green-100 text-green-600 rounded-md hover:bg-green-200 shadow-sm flex items-center gap-1"
                  >
                    <FiSave className="text-lg" /> Save
                  </button>
                  <button
                    onClick={cancelEdit}
                    className="p-2 bg-gray-100 text-gray-600 rounded-md hover:bg-gray-200 shadow-sm flex items-center gap-1"
                  >
                    <FiX className="text-lg" /> Cancel
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="p-4 md:p-6">
            {!isEditingCompany ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
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
                      <div>
                        <label className="block text-xs md:text-sm font-medium text-gray-500">Business Type</label>
                        <p className="text-sm md:text-base font-medium">{latestCompany.businessType}</p>
                      </div>
                      <div>
                        <label className="block text-xs md:text-sm font-medium text-gray-500">Business Category</label>
                        <p className="text-sm md:text-base font-medium">{latestCompany.businessCategory}</p>
                      </div>
                    </div>
                  </>
                ) : (
                  <p className="text-gray-500 col-span-2">No company information available</p>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Business Name</label>
                    <input
                      type="text"
                      name="businessName"
                      value={formData.businessName}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                    <input
                      type="text"
                      name="phoneNumber"
                      value={formData.phoneNumber}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">GSTIN</label>
                    <input
                      type="text"
                      name="gstin"
                      value={formData.gstin}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Business Type</label>
                    <input
                      type="text"
                      name="businessType"
                      value={formData.businessType}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Business Category</label>
                    <input
                      type="text"
                      name="businessCategory"
                      value={formData.businessCategory}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                    <input
                      type="text"
                      name="state"
                      value={formData.state}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Pincode</label>
                    <input
                      type="text"
                      name="pincode"
                      value={formData.pincode}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                    <textarea
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Logo</label>
                    <input
                      type="file"
                      name="logoUrl"
                      onChange={handleFileChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                    {formData.logoUrl && (
                      <img
                        src={formData.logoUrl}
                        alt="Logo Preview"
                        className="mt-2 h-20 object-contain"
                      />
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Signature</label>
                    <input
                      type="file"
                      name="signatureUrl"
                      onChange={handleFileChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                    {formData.signatureUrl && (
                      <img
                        src={formData.signatureUrl}
                        alt="Signature Preview"
                        className="mt-2 h-20 object-contain"
                      />
                    )}
                  </div>
                </div>
              </div>
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