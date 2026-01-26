const express = require('express');
const router = express.Router();
const {
  getAllAdmins,
  createAdmin,
  updateAdmin,
  deleteAdmin,
  getAllCustomers,
  getSystemStats
} = require('../controllers/superadminController');
const { protect, authorize } = require('../middleware/auth');
const { registerValidation, validate } = require('../middleware/validation');

// All routes are protected and superadmin only
router.use(protect);
router.use(authorize('superadmin'));

// Admin management routes
router.get('/admins', getAllAdmins);
router.post('/admins', registerValidation, validate, createAdmin);
router.put('/admins/:id', updateAdmin);
router.delete('/admins/:id', deleteAdmin);

// Customer management routes
router.get('/customers', getAllCustomers);

// System statistics
router.get('/stats', getSystemStats);

module.exports = router;
