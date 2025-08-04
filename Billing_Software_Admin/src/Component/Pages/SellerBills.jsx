import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../service/api';
import Swal from 'sweetalert2';

const SellerBills = () => {
  const navigate = useNavigate();
  const [supplierName, setSupplierName] = useState('');
  const [brand, setBrand] = useState('');
  const [sellerId, setSellerId] = useState(null);
  const [bills, setBills] = useState([]);
  const [gstBills, setGstBills] = useState([]);
  const [nonGstBills, setNonGstBills] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [formData, setFormData] = useState({
    billType: 'gst',
    billNumber: '',
    billDate: '',
    amount: '',
    billFile: null
  });

  // Fetch seller ID when supplier and brand are entered
  useEffect(() => {
    const fetchSellerId = async () => {
      if (supplierName && brand) {
        try {
          setLoading(true);
          const response = await api.get('/products/seller-info', {
            params: { supplierName, brand }
          });
          setSellerId(response.data.sellerId);
          fetchBills(response.data.sellerId);
        } catch (error) {
          console.error('Error fetching seller ID:', error);
          setSellerId(null);
          setBills([]);
          setGstBills([]);
          setNonGstBills([]);
        } finally {
          setLoading(false);
        }
      }
    };

    const debounceTimer = setTimeout(fetchSellerId, 500);
    return () => clearTimeout(debounceTimer);
  }, [supplierName, brand]);

  // Fetch bills for the seller
  const fetchBills = async (id) => {
    try {
      setLoading(true);
      const response = await api.get(`/seller-bills/seller/${id}`);
      setBills(response.data);
      
      // Separate GST and non-GST bills
      const gst = response.data.filter(bill => bill.billType === 'gst');
      const nonGst = response.data.filter(bill => bill.billType === 'non-gst');
      
      setGstBills(gst);
      setNonGstBills(nonGst);
    } catch (error) {
      console.error('Error fetching bills:', error);
      Swal.fire('Error', 'Failed to fetch bills', 'error');
    } finally {
      setLoading(false);
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
    setFormData(prev => ({
      ...prev,
      billFile: e.target.files[0]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!sellerId) {
      Swal.fire('Error', 'Please verify seller information first', 'error');
      return;
    }

    if (!formData.billFile) {
      Swal.fire('Error', 'Please select a PDF file', 'error');
      return;
    }

    const requiredFields = ['billNumber', 'billDate', 'amount'];
    const missingFields = requiredFields.filter(field => !formData[field]);
    
    if (missingFields.length > 0) {
      Swal.fire('Error', `Missing required fields: ${missingFields.join(', ')}`, 'error');
      return;
    }

    const formPayload = new FormData();
    formPayload.append('sellerId', sellerId);
    formPayload.append('supplierName', supplierName);
    formPayload.append('brand', brand);
    formPayload.append('billType', formData.billType);
    formPayload.append('billNumber', formData.billNumber);
    formPayload.append('billDate', formData.billDate);
    formPayload.append('amount', formData.amount);
    formPayload.append('bill', formData.billFile);

    try {
      setUploading(true);
      
      await api.post('/seller-bills/upload', formPayload, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      Swal.fire('Success', 'Bill uploaded successfully', 'success');
      
      // Reset form, hide upload form, and refresh bills
      setFormData({
        billType: 'gst',
        billNumber: '',
        billDate: '',
        amount: '',
        billFile: null
      });
      
      setShowUploadForm(false);
      fetchBills(sellerId);
    } catch (error) {
      console.error('Upload error:', error);
      
      let errorMessage = 'Failed to upload bill';
      let errorDetails = '';
      
      if (error.response) {
        errorMessage = error.response.data.error || errorMessage;
        errorDetails = error.response.data.details || '';
        
        if (error.response.data.missingFields) {
          errorDetails = `Missing fields: ${error.response.data.missingFields.join(', ')}`;
        }
      } else if (error.request) {
        errorMessage = 'No response from server';
      } else {
        errorMessage = error.message;
      }
      
      Swal.fire({
        title: 'Error',
        html: `${errorMessage}${errorDetails ? `<br><small>${errorDetails}</small>` : ''}`,
        icon: 'error'
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (billId, fileName) => {
    try {
      const response = await api.get(`/seller-bills/download/${billId}`, {
        responseType: 'blob'
      });
      
      // Create blob link to download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      // Track download in database
      await api.patch(`/seller-bills/track-download/${billId}`);
    } catch (error) {
      console.error('Download error:', error);
      Swal.fire('Error', 'Failed to download bill', 'error');
    }
  };

  const handleView = (billId) => {
    navigate(`/seller-bills/view/${billId}`);
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const toggleUploadForm = () => {
    setShowUploadForm(!showUploadForm);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Seller Bills Management</h1>

      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Seller Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Supplier Name
            </label>
            <input
              type="text"
              value={supplierName}
              onChange={(e) => setSupplierName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="Enter supplier name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Brand
            </label>
            <input
              type="text"
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="Enter brand"
            />
          </div>
        </div>
        {loading && <p className="text-sm text-gray-500">Looking up seller information...</p>}
        {sellerId && (
          <div className="flex items-center justify-between mt-4">
            <p className="text-sm text-green-600">
              Seller verified: {supplierName} - {brand}
            </p>
            <button
              onClick={toggleUploadForm}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              {showUploadForm ? 'Hide Upload Form' : 'Upload PDF Bill'}
            </button>
          </div>
        )}
      </div>

      {showUploadForm && (
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Upload New Bill</h2>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Bill Type
                </label>
                <select
                  name="billType"
                  value={formData.billType}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                >
                  <option value="gst">GST Bill</option>
                  <option value="non-gst">Non-GST Bill</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Bill Number
                </label>
                <input
                  type="text"
                  name="billNumber"
                  value={formData.billNumber}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Bill Date
                </label>
                <input
                  type="date"
                  name="billDate"
                  value={formData.billDate}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Amount (₹)
                </label>
                <input
                  type="number"
                  name="amount"
                  value={formData.amount}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                  min="0"
                  step="0.01"
                />
              </div>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Bill PDF
              </label>
              <input
                type="file"
                accept=".pdf"
                onChange={handleFileChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Only PDF files are accepted (max 5MB)
              </p>
            </div>
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={toggleUploadForm}
                className="px-4 py-2 border border-gray-300 rounded-md"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={uploading}
                className={`px-4 py-2 text-white rounded-md ${uploading ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'}`}
              >
                {uploading ? 'Uploading...' : 'Upload Bill'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Bills Listing Section */}
      {sellerId && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <div className="flex border-b">
              <button
                className={`px-4 py-2 font-medium ${activeTab === 'all' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
                onClick={() => setActiveTab('all')}
              >
                All Bills
              </button>
              <button
                className={`px-4 py-2 font-medium ${activeTab === 'gst' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
                onClick={() => setActiveTab('gst')}
              >
                GST Bills
              </button>
              <button
                className={`px-4 py-2 font-medium ${activeTab === 'non-gst' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
                onClick={() => setActiveTab('non-gst')}
              >
                Non-GST Bills
              </button>
            </div>
            <p className="text-sm text-gray-600">
              Showing bills for: {supplierName} - {brand}
            </p>
          </div>

          {loading ? (
            <p className="text-center py-4">Loading bills...</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Bill Number
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      File
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {activeTab === 'all' && bills.length === 0 && (
                    <tr>
                      <td colSpan="6" className="px-6 py-4 text-center text-sm text-gray-500">
                        No bills found for this seller
                      </td>
                    </tr>
                  )}
                  {activeTab === 'all' && bills.map((bill) => (
                    <tr key={bill.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {bill.billNumber}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {bill.billType === 'gst' ? 'GST' : 'Non-GST'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(bill.billDate)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        ₹{bill.amount.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {bill.fileName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        <button
                          onClick={() => handleView(bill.id)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          View
                        </button>
                        <button
                          onClick={() => handleDownload(bill.id, bill.fileName)}
                          className="text-green-600 hover:text-green-900"
                        >
                          Download
                        </button>
                      </td>
                    </tr>
                  ))}

                  {activeTab === 'gst' && gstBills.length === 0 && (
                    <tr>
                      <td colSpan="6" className="px-6 py-4 text-center text-sm text-gray-500">
                        No GST bills found for this seller
                      </td>
                    </tr>
                  )}
                  {activeTab === 'gst' && gstBills.map((bill) => (
                    <tr key={bill.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {bill.billNumber}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        GST
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(bill.billDate)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        ₹{bill.amount.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {bill.fileName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        <button
                          onClick={() => handleView(bill.id)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          View
                        </button>
                        <button
                          onClick={() => handleDownload(bill.id, bill.fileName)}
                          className="text-green-600 hover:text-green-900"
                        >
                          Download
                        </button>
                      </td>
                    </tr>
                  ))}

                  {activeTab === 'non-gst' && nonGstBills.length === 0 && (
                    <tr>
                      <td colSpan="6" className="px-6 py-4 text-center text-sm text-gray-500">
                        No Non-GST bills found for this seller
                      </td>
                    </tr>
                  )}
                  {activeTab === 'non-gst' && nonGstBills.map((bill) => (
                    <tr key={bill.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {bill.billNumber}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        Non-GST
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(bill.billDate)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        ₹{bill.amount.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {bill.fileName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        <button
                          onClick={() => handleView(bill.id)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          View
                        </button>
                        <button
                          onClick={() => handleDownload(bill.id, bill.fileName)}
                          className="text-green-600 hover:text-green-900"
                        >
                          Download
                        </button>
                      </td>
                      
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SellerBills;