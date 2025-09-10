const Company = require("../models/Company");
const cloudinary = require('cloudinary').v2;

// ✅ Register new company
exports.registerCompany = async (req, res) => {
  try {
    const {
      companyName,
      fullName,
      email,
      password,
      businessType,
      businessCategory,
      businessAddress,
      city,
      state,
      zip,
      country,
      mobile,
      gstNumber,
    } = req.body;

    let logoUrl = null;
    let signatureUrl = null;

    // Upload logo to Cloudinary if exists
    if (req.files?.logo) {
      try {
        const logoUpload = await cloudinary.uploader.upload(req.files.logo[0].path, {
          folder: 'company-logos'
        });
        logoUrl = logoUpload.secure_url;
      } catch (uploadError) {
        console.error("Logo upload error:", uploadError);
        return res.status(500).json({ message: "Failed to upload logo" });
      }
    }

    // Upload signature to Cloudinary if exists
    if (req.files?.signature) {
      try {
        const signatureUpload = await cloudinary.uploader.upload(req.files.signature[0].path, {
          folder: 'company-signatures'
        });
        signatureUrl = signatureUpload.secure_url;
      } catch (uploadError) {
        console.error("Signature upload error:", uploadError);
        return res.status(500).json({ message: "Failed to upload signature" });
      }
    }

    const newCompany = new Company({
      businessName: companyName,
      phoneNumber: mobile,
      gstin: gstNumber,
      email,
      businessType,
      businessCategory,
      state,
      pincode: zip,
      address: businessAddress,
      logoUrl,
      signatureUrl
    });

    await newCompany.save();

    res.status(201).json({
      message: "Company registered successfully",
      company: newCompany,
    });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ message: err.message || "Server error" });
  }
};

// ✅ Get all companies
exports.getAllCompanies = async (req, res) => {
  try {
    const companies = await Company.find().sort({ createdAt: -1 });
    res.status(200).json(companies);
  } catch (err) {
    console.error("Error fetching companies:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ✅ Get a single company by ID
exports.getCompanyById = async (req, res) => {
  try {
    const company = await Company.findById(req.params.id);
    if (!company) {
      return res.status(404).json({ message: "Company not found" });
    }
    res.status(200).json(company);
  } catch (err) {
    console.error("Error fetching company:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ✅ Update company
exports.updateCompany = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Handle file uploads to Cloudinary
    if (req.files?.logo) {
      try {
        const logoUpload = await cloudinary.uploader.upload(req.files.logo[0].path, {
          folder: 'company-logos'
        });
        updateData.logoUrl = logoUpload.secure_url;
      } catch (uploadError) {
        console.error("Logo upload error:", uploadError);
        return res.status(500).json({ message: "Failed to upload logo" });
      }
    }
    
    if (req.files?.signature) {
      try {
        const signatureUpload = await cloudinary.uploader.upload(req.files.signature[0].path, {
          folder: 'company-signatures'
        });
        updateData.signatureUrl = signatureUpload.secure_url;
      } catch (uploadError) {
        console.error("Signature upload error:", uploadError);
        return res.status(500).json({ message: "Failed to upload signature" });
      }
    }

    const updatedCompany = await Company.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!updatedCompany) {
      return res.status(404).json({ message: "Company not found" });
    }

    res.status(200).json({
      message: "Company updated successfully",
      company: updatedCompany,
    });
  } catch (err) {
    console.error("Update error:", err);
    res.status(500).json({ message: err.message || "Server error" });
  }
};

// ✅ Delete company
exports.deleteCompany = async (req, res) => {
  try {
    const { id } = req.params;
    const company = await Company.findById(id);
    
    if (!company) {
      return res.status(404).json({ message: "Company not found" });
    }

    // Delete images from Cloudinary if they exist
    if (company.logoUrl) {
      try {
        const publicId = company.logoUrl.split('/').pop().split('.')[0];
        await cloudinary.uploader.destroy(`company-logos/${publicId}`);
      } catch (error) {
        console.error("Error deleting logo from Cloudinary:", error);
      }
    }
    
    if (company.signatureUrl) {
      try {
        const publicId = company.signatureUrl.split('/').pop().split('.')[0];
        await cloudinary.uploader.destroy(`company-signatures/${publicId}`);
      } catch (error) {
        console.error("Error deleting signature from Cloudinary:", error);
      }
    }

    const deletedCompany = await Company.findByIdAndDelete(id);

    res.status(200).json({
      message: "Company deleted successfully",
      company: deletedCompany,
    });
  } catch (err) {
    console.error("Delete error:", err);
    res.status(500).json({ message: "Server error" });
  }
};