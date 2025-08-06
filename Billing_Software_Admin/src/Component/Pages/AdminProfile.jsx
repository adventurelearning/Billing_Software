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
  <div className="w-full p-4  sm:p-5 bg-white rounded-xl shadow-lg">
    <h1 className="text-xl font-semibold text-gray-900 mb-2 sm:mb-0">Admin Management</h1>

    <div className="flex flex-wrap justify-between items-center gap-4">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setShowAdminModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm sm:text-base"
        >
          Admin Credentials
        </button>
        <button
          type="button"
          onClick={() => setShowUserModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm sm:text-base"
        >
          User Credentials
        </button>
      </div>

      <CredentialForm
        showAdminModal={showAdminModal}
        showUserModal={showUserModal}
        onCloseAdmin={() => setShowAdminModal(false)}
        onCloseUser={() => setShowUserModal(false)}
      />

      <div className="relative group">
        <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden shadow-inner">
          {formik.values.logo ? (
            <img
              src={URL.createObjectURL(formik.values.logo)}
              alt="Business Logo"
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-gray-400 text-sm sm:text-base">Add Logo</span>
          )}
        </div>
        <label
          htmlFor="logo-upload"
          className="absolute bottom-2 -right-1 bg-blue-600 text-white p-1.5 rounded-full cursor-pointer hover:bg-blue-700 group-hover:scale-110 transition-all"
          title={formik.values.logo ? "Change Logo" : "Upload Logo"}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536M16.732 3.732a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
          </svg>
          <input
            id="logo-upload"
            type="file"
            name="logo"
            onChange={(e) => formik.setFieldValue("logo", e.currentTarget.files[0])}
            className="hidden"
            accept="image/*"
          />
        </label>
      </div>
    </div>

    <form onSubmit={formik.handleSubmit} className="space-y-2">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Business Details */}
        <div className="space-y-5">
          <h2 className="text-lg font-semibold text-gray-800 border-b pb-2">Business Details</h2>
          {[
            { id: 'businessName', label: 'Business Name', required: true, type: 'text', placeholder: 'Your Business Name' },
            { id: 'phoneNumber', label: 'Phone Number', type: 'tel', placeholder: 'e.g., 9876543210' },
            { id: 'gstin', label: 'GSTIN', type: 'text', placeholder: 'e.g., 22AAAAA0000A1Z5' },
            { id: 'email', label: 'Email ID', type: 'email', placeholder: 'your.email@example.com' }
          ].map(({ id, label, required, type, placeholder }) => (
            <div key={id} className="space-y-1 text-sm">
              <label htmlFor={id}>
                {label}{required && <span className="text-red-500">*</span>}
              </label>
              <input
                type={type}
                id={id}
                name={id}
                value={formik.values[id]}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                placeholder={placeholder}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              {formik.touched[id] && formik.errors[id] && (
                <p className="text-red-500 text-sm">{formik.errors[id]}</p>
              )}
            </div>
          ))}
        </div>

        {/* More Details */}
        <div className="space-y-5">
          <h2 className="text-lg font-semibold text-gray-800 border-b pb-2">More Details</h2>

          {/* Business Type */}
          <div className="space-y-1 text-sm">
            <label htmlFor="businessType">Business Type</label>
            <select
              id="businessType"
              name="businessType"
              value={formik.values.businessType}
              onChange={formik.handleChange}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Business Type</option>
              {["Retail", "Wholesale", "Manufacturer", "Distributor", "Service", "Others"].map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          {/* Business Category */}
          <div className="space-y-1 text-sm">
            <label htmlFor="businessCategory">Business Category</label>
            <select
              id="businessCategory"
              name="businessCategory"
              value={formik.values.businessCategory}
              onChange={formik.handleChange}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Business Category</option>
              {[
                "Food & Beverage", "Electronics", "Clothing", "Health & Wellness",
                "Beauty & Personal Care", "Automotive", "Education & Training",
                "Home & Furniture", "Books & Stationery", "Grocery & Essentials",
                "Sports & Fitness", "Stationery", "Jewelry & Accessories",
                "Toys & Baby Products", "Pharmacy & Medical", "Hardware & Tools",
                "Mobile & Gadgets", "Pet Supplies", "Real Estate", "Services",
                "Footwears", "Leather Products", "Agriculture / Farming Supplies", "Others"
              ].map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>

          {/* State */}
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
              {[
                "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat",
                "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh",
                "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan",
                "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
                "Andaman and Nicobar Islands", "Chandigarh", "Dadra and Nagar Haveli and Daman and Diu", "Delhi",
                "Jammu and Kashmir", "Ladakh", "Lakshadweep", "Puducherry"
              ].map(state => (
                <option key={state} value={state}>{state}</option>
              ))}
            </select>
          </div>

          {/* Pincode */}
          <div className="space-y-1 text-sm">
            <label htmlFor="pincode">Pincode</label>
            <input
              type="text"
              id="pincode"
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

        {/* Other Details */}
        <div className="space-y-5">
          <h2 className="text-lg font-semibold text-gray-800 border-b pb-2">Other Details</h2>

          {/* Address */}
          <div className="space-y-1 text-sm">
            <label htmlFor="address">Business Address</label>
            <textarea
              id="address"
              name="address"
              rows="4"
              value={formik.values.address}
              onChange={formik.handleChange}
              placeholder="Full business address..."
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Signature */}
          <div className="space-y-1 text-sm">
            <label htmlFor="signature-upload">Signature</label>
            <label
              htmlFor="signature-upload"
              className="flex flex-col items-center justify-center h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-400 hover:bg-blue-50"
            >
              {formik.values.signature ? (
                <img
                  src={URL.createObjectURL(formik.values.signature)}
                  alt="Signature"
                  className="h-full object-contain p-2"
                />
              ) : (
                <div className="text-center p-4">
                  <svg className="w-10 h-10 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <span className="block mt-2 text-base text-gray-500">Upload Signature</span>
                </div>
              )}
              <input
                id="signature-upload"
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

      {/* Submit Button */}
      <div className="flex justify-end border-t pt-5">
        <div className="flex gap-3">
          <button
            type="button"
            className="px-4 py-2 border rounded-lg text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={formik.isSubmitting}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            {formik.isSubmitting ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </form>
  </div>
);

};
export default AdminProfile;












