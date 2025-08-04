import React, { useState } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { toast } from 'react-toastify';
import CredentialForm from "./CredentialForm";
import api from "../../service/api";
const AdminProfile = () => {
  const formik = useFormik({
    initialValues: {
      businessName: "",
      phoneNumber: "",
      gstin: "",
      email: "",
      businessType: "",
      businessCategory: "",
      state: "",
      pincode: "",
      address: "",
      logo: null,
      signature: null,
    },
    validationSchema: Yup.object({
      businessName: Yup.string().required("Business name is required"),
      phoneNumber: Yup.string()
        .matches(/^\d{10}$/, "Must be a valid 10-digit number")
        .nullable(),
      gstin: Yup.string()
        .matches(
          /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/,
          "Invalid GSTIN format"
        )
        .nullable(),
      email: Yup.string().email("Invalid email").nullable(),
      pincode: Yup.string()
        .matches(/^\d{6}$/, "Pincode must be 6 digits")
        .nullable(),
    }),
    onSubmit: async (values, { resetForm }) => {
      try {
        const formData = new FormData();
        formData.append("companyName", values.businessName);
        formData.append("fullName", values.businessName); // or map properly
        formData.append("email", values.email);
        formData.append("password", "12345678"); // If needed, you can include or remove this
        formData.append("businessType", values.businessType);
        formData.append("businessCategory", values.businessCategory);
        formData.append("businessAddress", values.address);
        formData.append("city", ""); // Add if needed
        formData.append("state", values.state);
        formData.append("zip", values.pincode);
        formData.append("country", "India"); // Set as default or from dropdown
        formData.append("mobile", values.phoneNumber);
        formData.append("gstNumber", values.gstin);
        if (values.logo) {
          formData.append("logo", values.logo);
        }
        if (values.signature) {
          formData.append("signature", values.signature);
        }

        const response = await api.post("/companies/register", formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });

        console.log("Company registered:", response.data);
        toast.success("Company registered successfully!");
        resetForm(); // Optional: reset the form
      } catch (error) {
        console.error("Registration error:", error.response?.data || error.message);
        toast.error("Registration failed!");
      }
    },
  });
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);

  return (
    <div className="w-full p-5 bg-white rounded-xl shadow-lg">
      <h1 className="text-xl font-semibold text-gray-900 text-start">Edit Profile</h1>
      <div className="flex justify-between items-center mb-4"> {/* Added items-center for vertical alignment */}
        <div>
          <button
            type="button"
            onClick={() => setShowAdminModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-md"
          >
            Admin Credentials
          </button>
          <button
            type="button"
            onClick={() => setShowUserModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-md ml-2"
          >
            User Credentials
          </button>
        </div>
        <CredentialForm
          showAdminModal={showAdminModal}
          showUserModal={showUserModal}
          onCloseAdmin={() => setShowAdminModal(false)}
          onCloseUser={() => setShowUserModal(false)} />
        {/* Logo Upload Section */}
        <div className="relative group mr-10">
          <div className="w-32 h-32 rounded-full bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden shadow-inner">
            {formik.values.logo ? (
              <img
                src={URL.createObjectURL(formik.values.logo)}
                alt="Business Logo"
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-gray-400 text-lg">Add Logo</span>
            )}
          </div>
          <label
            htmlFor="logo-upload" // Added htmlFor for accessibility
            className="absolute bottom-3 -right-1 bg-blue-600 text-white p-1.5 rounded-full cursor-pointer shadow-md transition-all duration-200 hover:bg-blue-700 group-hover:scale-110"
            title={formik.values.logo ? "Change Logo" : "Upload Logo"} // Tooltip
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
            <input
              id="logo-upload" // Added id for accessibility
              type="file"
              name="logo"
              onChange={(e) => {
                formik.setFieldValue("logo", e.currentTarget.files[0]);
                // You might want to handle an error if file is not an image
              }}
              className="hidden"
              accept="image/*"
            />
          </label>
        </div>
      </div>

      <form onSubmit={formik.handleSubmit} className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-10">
          {/* Left Column: Business Details */}
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-gray-800 border-b pb-3 mb-4">Business Details</h2>
            <div className="grid grid-cols-1 gap-6">
              <div className="space-y-1 text-sm">
                <label htmlFor="businessName">
                  Business Name<span className="text-red-500">*</span> {/* Red asterisk for required */}
                </label>
                <input
                  type="text"
                  id="businessName" // Added id for accessibility
                  name="businessName"
                  value={formik.values.businessName}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  placeholder="Your Business Name"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                {formik.touched.businessName && formik.errors.businessName && (
                  <p className="text-red-500 text-sm">{formik.errors.businessName}</p>
                )}
              </div>

              <div className="space-y-1 text-sm">
                <label htmlFor="phoneNumber">Phone Number</label>
                <input
                  type="tel"
                  id="phoneNumber" // Added id
                  name="phoneNumber"
                  value={formik.values.phoneNumber}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  placeholder="e.g., 9876543210"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                {formik.touched.phoneNumber && formik.errors.phoneNumber && (
                  <p className="text-red-500 text-sm">{formik.errors.phoneNumber}</p>
                )}
              </div>

              <div className="space-y-1 text-sm">
                <label htmlFor="gstin">GSTIN</label>
                <input
                  type="text"
                  id="gstin" // Added id
                  name="gstin"
                  value={formik.values.gstin}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  placeholder="e.g., 22AAAAA0000A1Z5"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                {formik.touched.gstin && formik.errors.gstin && (
                  <p className="text-red-500 text-sm">{formik.errors.gstin}</p>
                )}
              </div>

              <div className="space-y-1 text-sm">
                <label htmlFor="email">Email ID</label>
                <input
                  type="email"
                  id="email" // Added id
                  name="email"
                  value={formik.values.email}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  placeholder="your.email@example.com"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                {formik.touched.email && formik.errors.email && (
                  <p className="text-red-500 text-sm">{formik.errors.email}</p>
                )}
              </div>
            </div>
          </div>

          {/* Center Column: More Details */}
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-gray-800 border-b pb-3 mb-4">More Details</h2>
            <div className="grid grid-cols-1 gap-6">
              <div className="space-y-1 text-sm">
                <label htmlFor="businessType">Business Type</label>
                <select
                  id="businessType" // Added id
                  name="businessType"
                  value={formik.values.businessType}
                  onChange={formik.handleChange}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Business Type</option>
                  <option value="Retail">Retail</option>
                  <option value="Wholesale">Wholesale</option>
                  <option value="Manufacturer">Manufacturer</option>
                  <option value="Distributor">Distributor</option>
                  <option value="Service">Service</option>
                  <option value="Others">Others</option>
                </select>
              </div>

              <div className="space-y-1 text-sm">
                <label htmlFor="businessCategory">Business Category</label>
                <select
                  id="businessCategory" // Added id
                  name="businessCategory"
                  value={formik.values.businessCategory}
                  onChange={formik.handleChange}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Business Category</option>
                  <option value="Food & Beverage">Food & Beverage</option>
                  <option value="Electronics">Electronics</option>
                  <option value="Clothing">Clothing</option>
                  <option value="Health & Wellness">Health & Wellness</option>
                  <option value="Beauty & Personal Care">Beauty & Personal Care</option>
                  <option value="Automotive">Automotive</option>
                  <option value="Education & Training">Education & Training</option>
                  <option value="Home & Furniture">Home & Furniture</option>
                  <option value="Books & Stationery">Books & Stationery</option>
                  <option value="Grocery & Essentials">Grocery & Essentials</option>
                  <option value="Sports & Fitness">Sports & Fitness</option>
                  <option value="Stationery">Stationery</option>               
                  <option value="Jewelry & Accessories">Jewelry & Accessories</option>
                  <option value="Toys & Baby Products">Toys & Baby Products</option>
                  <option value="Pharmacy & Medical">Pharmacy & Medical</option>
                  <option value="Hardware & Tools">Hardware & Tools</option>
                  <option value="Mobile & Gadgets">Mobile & Gadgets</option>
                  <option value="Pet Supplies">Pet Supplies</option>
                  <option value="Real Estate">Real Estate</option>
                  <option value="Services">Services</option>
                  <option value="Footwears">Footwears</option>
                  <option value="Leather Products">Leather Products</option>
                  <option value="others">Agriculture / Farming Supplies</option>
                    <option value="others">Others</option>
                </select>
              </div>

              <div className="space-y-1 text-sm">
                <label htmlFor="state">State</label>
                <select
                  id="state"
                  name="state"
                  value={formik.values.state}
                  onChange={formik.handleChange}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select State</option>
                  <option value="Andhra Pradesh">Andhra Pradesh</option>
                  <option value="Arunachal Pradesh">Arunachal Pradesh</option>
                  <option value="Assam">Assam</option>
                  <option value="Bihar">Bihar</option>
                  <option value="Chhattisgarh">Chhattisgarh</option>
                  <option value="Goa">Goa</option>
                  <option value="Gujarat">Gujarat</option>
                  <option value="Haryana">Haryana</option>
                  <option value="Himachal Pradesh">Himachal Pradesh</option>
                  <option value="Jharkhand">Jharkhand</option>
                  <option value="Karnataka">Karnataka</option>
                  <option value="Kerala">Kerala</option>
                  <option value="Madhya Pradesh">Madhya Pradesh</option>
                  <option value="Maharashtra">Maharashtra</option>
                  <option value="Manipur">Manipur</option>
                  <option value="Meghalaya">Meghalaya</option>
                  <option value="Mizoram">Mizoram</option>
                  <option value="Nagaland">Nagaland</option>
                  <option value="Odisha">Odisha</option>
                  <option value="Punjab">Punjab</option>
                  <option value="Rajasthan">Rajasthan</option>
                  <option value="Sikkim">Sikkim</option>
                  <option value="Tamil Nadu">Tamil Nadu</option>
                  <option value="Telangana">Telangana</option>
                  <option value="Tripura">Tripura</option>
                  <option value="Uttar Pradesh">Uttar Pradesh</option>
                  <option value="Uttarakhand">Uttarakhand</option>
                  <option value="West Bengal">West Bengal</option>
                  <option value="Andaman and Nicobar Islands">Andaman and Nicobar Islands</option>
                  <option value="Chandigarh">Chandigarh</option>
                  <option value="Dadra and Nagar Haveli and Daman and Diu">Dadra and Nagar Haveli and Daman and Diu</option>
                  <option value="Delhi">Delhi</option>
                  <option value="Jammu and Kashmir">Jammu and Kashmir</option>
                  <option value="Ladakh">Ladakh</option>
                  <option value="Lakshadweep">Lakshadweep</option>
                  <option value="Puducherry">Puducherry</option>
                </select>
              </div>

              <div className="space-y-1 text-sm">
                <label htmlFor="pincode">Pincode</label>
                <input
                  type="text"
                  id="pincode" // Added id
                  name="pincode"
                  value={formik.values.pincode}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  placeholder="e.g., 641001"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                {formik.touched.pincode && formik.errors.pincode && (
                  <p className="text-red-500 text-sm">{formik.errors.pincode}</p>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-5">
            <h2 className="text-lg font-semibold text-gray-800 border-b pb-3 mb-4">Other Details</h2>
            <div className="space-y-1">
              <label htmlFor="address">Business Address</label>
              <textarea
                id="address" // Added id
                name="address"
                rows="4"
                value={formik.values.address}
                onChange={formik.handleChange}
                placeholder="Full business address..."
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className=" space-y-1 ">
              <label htmlFor="signature-upload">Signature</label>
              <label
                htmlFor="signature-upload"
                className="flex flex-col items-center justify-center h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-400 hover:bg-blue-50"
              >
                {formik.values.signature ? (
                  <img src={URL.createObjectURL(formik.values.signature)} alt="Signature" className="h-full object-contain p-2" />
                ) : (
                  <div className="text-center p-4">
                    <svg className="w-10 h-10 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <span className="block mt-2 text-base text-gray-500">Upload Signature</span>
                  </div>
                )}
                <input
                  id="signature-upload" // Added id for accessibility
                  type="file"
                  name="signature"
                  onChange={(e) => formik.setFieldValue("signature", e.currentTarget.files[0])}
                  className="hidden"
                  accept="image/*"
                />
              </label>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end items-center pt-4 border-t border-gray-200">
          <div className="flex space-x-3">
            <button type="button" className="px-4 py-2 border rounded-lg text-gray-700 hover:bg-gray-50">
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-md"
              disabled={formik.isSubmitting} // Disable button during submission
            >
              {formik.isSubmitting ? 'Saving...' : 'Save Changes'} {/* Dynamic button text */}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
export default AdminProfile;












