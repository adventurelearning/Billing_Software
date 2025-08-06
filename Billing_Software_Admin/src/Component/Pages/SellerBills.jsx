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
      // Create a hidden anchor tag to trigger download
      const link = document.createElement('a');
      link.href = `/api/seller-bills/download/${billId}`;
      link.setAttribute('download', fileName || 'bill.pdf');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Track download in database
      await api.patch(`/seller-bills/track-download/${billId}`);
    } catch (error) {
      console.error('Download error:', error);
      Swal.fire('Error', 'Failed to download bill', 'error');
    }
  };

  const handleView = async (billId) => {
    try {
      // Open in new tab for viewing
      window.open(`/api/seller-bills/secure-view/${billId}`, '_blank');
    } catch (error) {
      console.error('View error:', error);
      Swal.fire('Error', 'Failed to view PDF', 'error');
    }
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const toggleUploadForm = () => {
    setShowUploadForm(!showUploadForm);
  };

  return (
    <div className="font-sans text-gray-900 bg-gray-50 min-h-screen">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-2">
          <div className="flex flex-col py-3">
            <div className="flex justify-between items-center">
              <h1 className="text-lg md:text-xl font-semibold text-gray-700 whitespace-nowrap bg-blue-100 p-2 rounded-md">
                Seller Bills Management
              </h1>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-4 py-6 space-y-4">
        {/* Seller Information Card */}
        <div className="bg-white rounded-lg shadow p-4 sm:p-6">
          <h2 className="text-lg sm:text-xl font-semibold mb-4">Seller Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Supplier Name
              </label>
              <input
                type="text"
                value={supplierName}
                onChange={(e) => setSupplierName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter brand"
              />
            </div>
          </div>

          {loading && (
            <p className="text-sm text-gray-500 flex items-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Looking up seller information...
            </p>
          )}

          {sellerId && (
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mt-4 gap-3">
              <p className="text-sm text-green-600 flex-1">
                Seller verified: {supplierName} - {brand}
              </p>
              <button
                onClick={toggleUploadForm}
                className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                {showUploadForm ? 'Hide Upload Form' : 'Upload PDF Bill'}
              </button>
            </div>
          )}
        </div>

        {/* Upload Form */}
        {showUploadForm && (
          <div className="bg-white rounded-lg shadow p-4 sm:p-6">
            <h2 className="text-lg sm:text-xl font-semibold mb-4">Upload New Bill</h2>
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
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
                <div className="flex items-center">
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={handleFileChange}
                    className="block w-full text-sm text-gray-500
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-md file:border-0
                    file:text-sm file:font-semibold
                    file:bg-blue-50 file:text-blue-700
                    hover:file:bg-blue-100"
                    required
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Only PDF files are accepted (max 5MB)
                </p>
              </div>

              <div className="flex flex-col-reverse sm:flex-row justify-end gap-3">
                <button
                  type="button"
                  onClick={toggleUploadForm}
                  className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className={`px-4 py-2 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${uploading ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'
                    }`}
                >
                  {uploading ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Uploading...
                    </span>
                  ) : 'Upload Bill'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Bills Listing Section */}
        {sellerId && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 sm:p-6 border-b">
              <div className="flex overflow-x-auto pb-2 sm:pb-0 mb-3 sm:mb-0">
                <button
                  className={`px-3 py-1 sm:px-4 sm:py-2 text-sm font-medium whitespace-nowrap ${activeTab === 'all' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'
                    }`}
                  onClick={() => setActiveTab('all')}
                >
                  All Bills
                </button>
                <button
                  className={`px-3 py-1 sm:px-4 sm:py-2 text-sm font-medium whitespace-nowrap ${activeTab === 'gst' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'
                    }`}
                  onClick={() => setActiveTab('gst')}
                >
                  GST Bills
                </button>
                <button
                  className={`px-3 py-1 sm:px-4 sm:py-2 text-sm font-medium whitespace-nowrap ${activeTab === 'non-gst' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'
                    }`}
                  onClick={() => setActiveTab('non-gst')}
                >
                  Non-GST Bills
                </button>
              </div>
              <p className="text-sm text-gray-600 whitespace-nowrap">
                Showing bills for: {supplierName} - {brand}
              </p>
            </div>

            {loading ? (
              <div className="p-8 text-center">
                <div className="flex justify-center">
                  <svg className="animate-spin h-8 w-8 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </div>
                <p className="mt-2 text-sm text-gray-500">Loading bills...</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Bill Number
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                        Type
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                        Date
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                        File
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {renderBills()}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );

  // Helper function to render bills based on active tab
  function renderBills() {
    const billsToRender =
      activeTab === 'all' ? bills :
        activeTab === 'gst' ? gstBills :
          nonGstBills;

    if (billsToRender.length === 0) {
      return (
        <tr>
          <td colSpan="6" className="px-4 py-4 text-center text-sm text-gray-500">
            No {activeTab === 'all' ? '' : activeTab + ' '}bills found for this seller
          </td>
        </tr>
      );
    }

    return billsToRender.map((bill) => (
      <tr key={bill.id} className="hover:bg-gray-50">
        <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
          {bill.billNumber}
        </td>
        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 hidden sm:table-cell">
          {bill.billType === 'gst' ? 'GST' : 'Non-GST'}
        </td>
        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 hidden md:table-cell">
          {formatDate(bill.billDate)}
        </td>
        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
          ₹{bill.amount.toFixed(2)}
        </td>
        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 hidden sm:table-cell">
          <span className="truncate max-w-xs block">{bill.fileName}</span>
        </td>
        <td className="px-4 py-4 whitespace-nowrap text-sm font-medium space-x-2">
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
    ));
  }
};
export default SellerBills;