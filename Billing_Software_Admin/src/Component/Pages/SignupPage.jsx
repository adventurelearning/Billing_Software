import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../service/api';

// Simple Message Display Component
const MessageDisplay = ({ message, type, onClose }) => {
  if (!message) return null;

  const bgColor = type === 'success' ? 'bg-green-100 border-green-400 text-green-700' : 'bg-red-100 border-red-400 text-red-700';
  const textColor = type === 'success' ? 'text-green-800' : 'text-red-800';

  return (
    <div className={`fixed top-4 left-1/2 -translate-x-1/2 p-4 rounded-lg shadow-lg flex items-center justify-between z-50 transition-all duration-300 transform scale-100 opacity-100 ${bgColor}`} style={{ minWidth: '300px', maxWidth: '90%' }}>
      <span className={`font-medium text-sm ${textColor}`}>{message}</span>
      <button onClick={onClose} className="ml-4 text-gray-500 hover:text-gray-700 focus:outline-none">
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
        </svg>
      </button>
    </div>
  );
};


const SignupPage = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    // Step 1 fields
    fullName: '',
    email: '',
    mobile: '',
    password: '',
    confirmPassword: '',

    // Step 2 fields
    companyName: '',
    businessType: '',
    gstNumber: '',
    businessAddress: '',
    city: '',
    state: '',
    zip: '',
    country: '',
    logo: null, // Stores the File object
    logoPreview: '' // Stores Base64 for display
  });

  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState(''); // 'success' or 'error'

  const showMessage = (msg, type) => {
    setMessage(msg);
    setMessageType(type);
    // Auto-hide message after 5 seconds
    setTimeout(() => {
      setMessage('');
      setMessageType('');
    }, 5000);
  };

  const businessTypes = [
    'Retail',
    'Wholesale',
    'Manufacturing',
    'Service',
    'E-commerce',
    'Other'
  ];

  const countries = [
    'United States',
    'Canada',
    'United Kingdom',
    'Australia',
    'India',
    'Germany',
    'France',
    'Other'
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({
          ...formData,
          logo: file,
          logoPreview: reader.result
        });
      };
      reader.readAsDataURL(file);
    } else {
      setFormData({
        ...formData,
        logo: null,
        logoPreview: ''
      });
    }
  };

  const nextStep = () => {
    setMessage(''); // Clear previous messages
    if (step === 1) {
      if (!formData.fullName || !formData.email || !formData.mobile || !formData.password || !formData.confirmPassword) {
        showMessage('Please fill in all account information fields.', 'error');
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        showMessage('Passwords do not match.', 'error');
        return;
      }
      if (formData.password.length < 8) {
        showMessage('Password must be at least 8 characters long.', 'error');
        return;
      }
    } else if (step === 2) {
      if (!formData.companyName || !formData.businessType || !formData.gstNumber || !formData.businessAddress || !formData.city || !formData.state || !formData.zip || !formData.country) {
        showMessage('Please fill in all company information fields.', 'error');
        return;
      }
    }
    setStep(step + 1);
  };

  const prevStep = () => {
    setMessage(''); // Clear previous messages
    setStep(step - 1);
  };

  const sendData = async (data) => {
    try {
      const formData = new FormData();

      // Append all fields from data
      formData.append('companyName', data.companyName);
      formData.append('fullName', data.fullName);
      formData.append('email', data.email);
      formData.append('password', data.password);
      formData.append('businessType', data.businessType);
      formData.append('businessAddress', data.businessAddress);
      formData.append('city', data.city);
      formData.append('state', data.state);
      formData.append('zip', data.zip);
      formData.append('country', data.country);
      formData.append('mobile', data.mobile);
      formData.append('gstNumber', data.gstNumber);

      // Append logo file (make sure data.logo is a File object)
      if (data.logo) {
        formData.append('logo', data.logo);
      }

      const response = await api.post('/company/register', formData, {
        headers: {
          'Content-Type': 'multipart/form-data' // Important for file uploads
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Something went wrong during signup.');
      }

      const responseData = await response.json();
      console.log('Signup successful:', responseData);

      showMessage('Signup successful! Welcome aboard.', 'success');
      navigate('/admin'); // Redirect after successful signup

    } catch (error) {
      console.error('Error during signup:', error.message);
      showMessage(`Signup failed: ${error.message}`, 'error');
    }
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(''); // Clear previous messages
    console.log(formData)
    if (step !== 3) {
      showMessage('Please review all details before submitting.', 'error');
      return;
    }

    const dataToSend = { ...formData };
    delete dataToSend.confirmPassword; // Don't send confirmPassword to the backend
    delete dataToSend.logoPreview;     // Don't send logoPreview to the backend

    // Handle logo file: Convert to Base64
    if (dataToSend.logo) {
      const reader = new FileReader();
      reader.readAsDataURL(dataToSend.logo);
      reader.onloadend = () => {
        dataToSend.logo = reader.result; // Base64 string
        sendData(dataToSend);
      };
      reader.onerror = () => {
        showMessage('Failed to read logo file.', 'error');
      };
    } else {
      sendData(dataToSend);
    }
  };

  const renderCurrentStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="p-3 h-full flex flex-col">
            <div className="mb-2">
              <h3 className="text-2xl font-semibold text-gray-900 leading-tight">Account Information</h3>
              <p className="text-gray-600 mt-2 text-lg">Let's start with your personal details to create your account.</p>
            </div>

            <div className="grid grid-cols-1 gap-3 flex-grow">
              <div>
                <label htmlFor="fullName" className="block text-sm font-semibold text-gray-700 mb-2">User Name</label>
                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={handleChange}
                  className="w-3/4 px-4 py-2 rounded-lg border border-gray-300 focus:ring-blue-500 focus:border-blue-500 transition duration-200 text-base placeholder-gray-400"
                  placeholder="e.g., John Doe"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="w-3/4 px-4 py-2 rounded-lg border border-gray-300 focus:ring-blue-500 focus:border-blue-500 transition duration-200 text-base placeholder-gray-400"
                  placeholder="e.g., john.doe@example.com"
                />
              </div>

              <div>
                <label htmlFor="mobile" className="block text-sm font-semibold text-gray-700 mb-2">Mobile Number</label>
                <input
                  id="mobile"
                  name="mobile"
                  type="tel"
                  required
                  value={formData.mobile}
                  onChange={handleChange}
                  className="w-3/4 px-4 py-2 rounded-lg border border-gray-300 focus:ring-blue-500 focus:border-blue-500 transition duration-200 text-base placeholder-gray-400"
                  placeholder="e.g., +91 98765 43210"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="w-3/4 px-4 py-2 rounded-lg border border-gray-300 focus:ring-blue-500 focus:border-blue-500 transition duration-200 text-base placeholder-gray-400"
                  placeholder="Minimum 8 characters"
                />
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-semibold text-gray-700 mb-2">Confirm Password</label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="w-3/4 px-4 py-2 rounded-lg border border-gray-300 focus:ring-blue-500 focus:border-blue-500 transition duration-200 text-base placeholder-gray-400"
                  placeholder="Re-enter your password"
                />
              </div>
            </div>

            <div className="flex justify-end pt-6 pr-52">
              <button
                type="button"
                onClick={nextStep}
                className="px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-md transition duration-300 ease-in-out transform hover:scale-105 flex items-center text-sm"
              >
                Continue
                <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path>
                </svg>
              </button>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="p-3 h-full flex flex-col">
            <div className="mb-2">
              <h3 className="text-2xl font-semibold text-gray-900 leading-tight">Company Information</h3>
              <p className="text-gray-600 mt-2 text-lg">Tell us a bit about your business to get started.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pr-2">
              <div className="md:col-span-1">
                <label htmlFor="companyName" className="block text-sm font-semibold text-gray-700 mb-2">Company Name</label>
                <input
                  id="companyName"
                  name="companyName"
                  type="text"
                  required
                  value={formData.companyName}
                  onChange={handleChange}
                  className="w-3/4 px-4 py-2 rounded-lg border border-gray-300 focus:ring-blue-500 focus:border-blue-500 transition duration-200 text-base placeholder-gray-400"
                  placeholder="e.g., Acme Corp"
                />
              </div>

              <div>
                <label htmlFor="businessType" className="block text-sm font-semibold text-gray-700 mb-2">Business Type</label>
                <select
                  id="businessType"
                  name="businessType"
                  required
                  value={formData.businessType}
                  onChange={handleChange}
                  className="w-3/4 px-4 py-2 rounded-lg border border-gray-300 focus:ring-blue-500 focus:border-blue-500 transition duration-200 text-base placeholder-gray-400"
                >
                  <option value="">Select Business Type</option>
                  {businessTypes.map((type) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="gstNumber" className="block text-sm font-semibold text-gray-700 mb-2">GST Number / Tax ID</label>
                <input
                  id="gstNumber"
                  name="gstNumber"
                  type="text"
                  required
                  value={formData.gstNumber}
                  onChange={handleChange}
                  className="w-3/4 px-4 py-2 rounded-lg border border-gray-300 focus:ring-blue-500 focus:border-blue-500 transition duration-200 text-base placeholder-gray-400"
                  placeholder="e.g., 22AAAAA0000A1Z5"
                />
              </div>

              <div className="md:col-span-1">
                <label htmlFor="businessAddress" className="block text-sm font-semibold text-gray-700 mb-2">Business Address</label>
                <input
                  id="businessAddress"
                  name="businessAddress"
                  type="text"
                  required
                  value={formData.businessAddress}
                  onChange={handleChange}
                  className="w-3/4 px-4 py-2 rounded-lg border border-gray-300 focus:ring-blue-500 focus:border-blue-500 transition duration-200 text-base placeholder-gray-400"
                  placeholder="e.g., 123 Business Rd"
                />
              </div>

              <div>
                <label htmlFor="city" className="block text-sm font-semibold text-gray-700 mb-2">City</label>
                <input
                  id="city"
                  name="city"
                  type="text"
                  required
                  value={formData.city}
                  onChange={handleChange}
                  className="w-3/4 px-4 py-2 rounded-lg border border-gray-300 focus:ring-blue-500 focus:border-blue-500 transition duration-200 text-base placeholder-gray-400"
                  placeholder="e.g., New Delhi"
                />
              </div>

              <div>
                <label htmlFor="state" className="block text-sm font-semibold text-gray-700 mb-2">State</label>
                <input
                  id="state"
                  name="state"
                  type="text"
                  required
                  value={formData.state}
                  onChange={handleChange}
                  className="w-3/4 px-4 py-2 rounded-lg border border-gray-300 focus:ring-blue-500 focus:border-blue-500 transition duration-200 text-base placeholder-gray-400"
                  placeholder="e.g., Delhi"
                />
              </div>

              <div>
                <label htmlFor="zip" className="block text-sm font-semibold text-gray-700 mb-2">ZIP Code</label>
                <input
                  id="zip"
                  name="zip"
                  type="text"
                  required
                  value={formData.zip}
                  onChange={handleChange}
                  className="w-3/4 px-4 py-2 rounded-lg border border-gray-300 focus:ring-blue-500 focus:border-blue-500 transition duration-200 text-base placeholder-gray-400"
                  placeholder="e.g., 110001"
                />
              </div>

              <div>
                <label htmlFor="country" className="block text-sm font-semibold text-gray-700 mb-2">Country</label>
                <select
                  id="country"
                  name="country"
                  required
                  value={formData.country}
                  onChange={handleChange}
                  className="w-3/4 px-4 py-2 rounded-lg border border-gray-300 focus:ring-blue-500 focus:border-blue-500 transition duration-200 text-base placeholder-gray-400"
                >
                  <option value="">Select Country</option>
                  {countries.map((country) => (
                    <option key={country} value={country}>{country}</option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-1">
                <label className="block text-sm font-semibold text-gray-700 ">Company Logo</label>
                <div className="flex items-center space-x-6">
                  <label htmlFor="logo-upload" className="cursor-pointer">
                    <span className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-base font-medium rounded-lg transition duration-200 inline-flex items-center shadow-sm">
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
                      </svg>
                      {formData.logo ? 'Change Logo' : 'Upload Logo'}
                    </span>
                    <input
                      id="logo-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                  {formData.logo && (
                    <button
                      type="button"
                      onClick={() => handleFileChange({ target: { files: [] } })}
                      className="text-red-600 hover:text-red-800 text-sm font-medium transition duration-200"
                    >
                      Remove
                    </button>
                  )}
                  <div className="relative flex-shrink-0">
                    {formData.logoPreview ? (
                      <img
                        src={formData.logoPreview}
                        alt="Company logo preview"
                        className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-lg"
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-full bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                        </svg>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-between pt-8">
              <button
                type="button"
                onClick={prevStep}
                className="px-3 py-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium rounded-md shadow-sm flex items-center text-xs"
              >
                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back
              </button>

              <button
                type="button"
                onClick={nextStep}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md shadow-sm flex items-center text-sm"
              >
                Review Details
                <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </button>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="p-4 sm:p-6 md:p-8 h-full flex flex-col">
            {/* Page Title */}
            <div className="mb-6">
              <h3 className="text-xl sm:text-2xl font-semibold text-gray-900">Review Your Details</h3>
              <p className="text-gray-600 mt-1 text-sm sm:text-base">Please confirm all information is correct before submitting your application.</p>
            </div>

            {/* Review Card */}
            <div className="bg-white rounded-xl p-6 sm:p-8 space-y-8 border border-gray-200 shadow-md">

              {/* Account Info Review */}
              <div>
                <h4 className="text-lg sm:text-xl font-bold text-gray-800 border-b border-blue-500 pb-2 mb-4">Account Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4 text-sm">
                  <div>
                    <div className="text-gray-500 font-medium mb-1">Full Name</div>
                    <div className="text-gray-900 font-semibold">{formData.fullName || 'Not provided'}</div>
                  </div>
                  <div>
                    <div className="text-gray-500 font-medium mb-1">Email</div>
                    <div className="text-gray-900 font-semibold">{formData.email || 'Not provided'}</div>
                  </div>
                  <div>
                    <div className="text-gray-500 font-medium mb-1">Mobile</div>
                    <div className="text-gray-900 font-semibold">{formData.mobile || 'Not provided'}</div>
                  </div>
                </div>
              </div>

              {/* Company Info Review */}
              <div>
                <h4 className="text-lg sm:text-xl font-bold text-gray-800 border-b border-blue-500 pb-2 mb-4">Company Information</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4 text-sm">
                  <div>
                    <div className="text-gray-500 font-medium mb-1">Company Name</div>
                    <div className="text-gray-900 font-semibold">{formData.companyName || 'Not provided'}</div>
                  </div>
                  <div>
                    <div className="text-gray-500 font-medium mb-1">Business Type</div>
                    <div className="text-gray-900 font-semibold">{formData.businessType || 'Not provided'}</div>
                  </div>
                  <div>
                    <div className="text-gray-500 font-medium mb-1">GST/Tax ID</div>
                    <div className="text-gray-900 font-semibold">{formData.gstNumber || 'Not provided'}</div>
                  </div>
                  <div className="sm:col-span-2">
                    <div className="text-gray-500 font-medium mb-1">Business Address</div>
                    <div className="text-gray-900 font-semibold leading-snug">
                      {formData.businessAddress || 'Not provided'}<br />
                      {formData.city && `${formData.city}, `}{formData.state} {formData.zip}<br />
                      {formData.country}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-500 font-medium mb-1">Company Logo</div>
                    <div className="mt-2">
                      {formData.logoPreview ? (
                        <img
                          src={formData.logoPreview}
                          alt="Company logo preview"
                          className="w-14 h-14 rounded-full object-cover border border-gray-300 shadow-sm"
                        />
                      ) : (
                        <div className="text-gray-400">No logo uploaded</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-between items-center pt-2">
                <button
                  type="button"
                  onClick={prevStep}
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium rounded-md shadow-sm transition duration-200 transform hover:scale-105 flex items-center text-sm"
                >
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  Back
                </button>

                <button
                  type="submit"
                  onClick={handleSubmit}
                  className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-md shadow-sm transition duration-200 transform hover:scale-105 flex items-center text-sm"
                >
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  Submit Application
                </button>
              </div>
            </div>
          </div>

        );
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 overflow-hidden font-sans bg-gray-100">
      <MessageDisplay message={message} type={messageType} onClose={() => setMessage('')} />
      <div className="h-full w-full">
        <div className="flex flex-col md:flex-row h-full">
          {/* Left Side - Visual Progress */}
          <div className="md:w-1/3 bg-gradient-to-br from-blue-600 to-blue-700 p-6 text-white flex flex-col justify-between shadow-2xl">
            <div className='pl-3'>
              <h2 className="text-3xl font-bold mb-4 leading-tight">Create your account</h2>

              <div className="space-y-6">
                {/* Step 1 Indicator */}
                <div className={`flex items-center space-x-4 transition-opacity duration-300 ${step >= 1 ? 'opacity-100' : 'opacity-60'}`}>
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-xl transition-all duration-300 ${step >= 1 ? 'bg-white text-blue-700 shadow-lg' : 'border-2 border-blue-300 text-blue-200'}`}>
                    1
                  </div>
                  <div>
                    <div className="font-semibold text-lg">Account Info</div>
                    <div className="text-sm text-blue-200">Your personal details</div>
                  </div>
                </div>

                {/* Connector Line */}
                <div className={`h-20 ml-6 border-l-2 transition-colors duration-300 ${step >= 2 ? 'border-white' : 'border-blue-400'}`}></div>

                {/* Step 2 Indicator */}
                <div className={`flex items-center space-x-4 transition-opacity duration-300 ${step >= 2 ? 'opacity-100' : 'opacity-60'}`}>
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-xl transition-all duration-300 ${step >= 2 ? 'bg-white text-blue-700 shadow-lg' : 'border-2 border-blue-300 text-blue-200'}`}>
                    2
                  </div>
                  <div>
                    <div className="font-semibold text-lg">Company Info</div>
                    <div className="text-sm text-blue-200">Business details</div>
                  </div>
                </div>

                {/* Connector Line */}
                <div className={`h-20 ml-6 border-l-2 transition-colors duration-300 ${step >= 3 ? 'border-white' : 'border-blue-400'}`}></div>

                {/* Step 3 Indicator */}
                <div className={`flex items-center space-x-4 transition-opacity duration-300 ${step >= 3 ? 'opacity-100' : 'opacity-60'}`}>
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-xl transition-all duration-300 ${step >= 3 ? 'bg-white text-blue-700 shadow-lg' : 'border-2 border-blue-300 text-blue-200'}`}>
                    3
                  </div>
                  <div>
                    <div className="font-semibold text-lg">Review & Submit</div>
                    <div className="text-sm text-blue-200">Confirm details</div>
                  </div>
                </div>
              </div>
            </div>
            <div className='mt-1'>
              <div className="mt-auto border-t border-blue-400 text-sm pb-12">
                <div className=" pt-2 text-base">Already have an account?</div>
                <a href="/" className="font-bold hover:underline text-blue-100 text-lg pt-2">Sign in here</a>
              </div>
            </div>
          </div>

          {/* Right Side - Form Content */}
          <div className="md:w-2/3 h-full overflow-y-auto bg-white shadow-inner-xl p-6">
            <form onSubmit={handleSubmit} className="h-full flex flex-col">
              {renderCurrentStep()}
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;
