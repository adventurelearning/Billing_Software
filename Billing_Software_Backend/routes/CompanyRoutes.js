const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");

// Import controllers
const {
  registerCompany,
  getAllCompanies,
  getCompanyById,
  updateCompany,
  deleteCompany
} = require("../controllers/CompanyController");

// Temporary local storage for Multer (files will be uploaded to Cloudinary and then removed)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Create temp directory if it doesn't exist
    const tempDir = path.join(__dirname, '../temp-uploads');
    if (!require('fs').existsSync(tempDir)) {
      require('fs').mkdirSync(tempDir, { recursive: true });
    }
    cb(null, tempDir);
  },
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname)),
});

const upload = multer({ 
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// ✅ POST - Register a company
router.post(
  "/register",
  upload.fields([
    { name: "logo", maxCount: 1 },
    { name: "signature", maxCount: 1 },
  ]),
  registerCompany
);

// ✅ GET - Get all companies
router.get("/", getAllCompanies);

// ✅ GET - Get a company by ID
router.get("/:id", getCompanyById);

// ✅ PUT - Update company
router.put(
  "/:id",
  upload.fields([
    { name: "logo", maxCount: 1 },
    { name: "signature", maxCount: 1 },
  ]),
  updateCompany
);

// ✅ DELETE - Delete company
router.delete("/:id", deleteCompany);

module.exports = router;