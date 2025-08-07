const express = require('express');
const router = express.Router();
const {
  saveAdmin,
  saveUser,
  getAdmin,
  getUsers,
  deleteUser
} = require('../controllers/credentialController');

router.post('/admin', saveAdmin);
router.post('/users', saveUser);

router.get('/admin', getAdmin);
router.get('/users', getUsers);
router.delete('/users/:id', deleteUser);

module.exports = router;
