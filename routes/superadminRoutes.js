const express = require('express');
const router = express.Router();
const {
  getAllAdmins,
  createAdmin,
  updateAdmin,
  deleteAdmin,
  getAllCustomers,
  findOrCreateCustomer,
  createCustomer,
  getSystemStats
} = require('../controllers/superadminController');
const { protect, authorize } = require('../middleware/auth');
const { registerValidation, validate } = require('../middleware/validation');

// All routes are protected and superadmin only
// All routes are protected
router.use(protect);

// Most routes are superadmin only
router.use((req, res, next) => {
  // Allow admins to create customers and find-or-create (for booking)
  if ((req.path === '/customers' || req.path === '/customers/find-or-create') && req.method === 'POST') {
    if (req.user.role === 'superadmin' || req.user.role === 'admin') {
      return next();
    }
  }
  
  // All other routes require superadmin
  return authorize('superadmin')(req, res, next);
});

// Admin management routes
router.get('/admins', getAllAdmins);
router.post('/admins', registerValidation, validate, createAdmin);
router.put('/admins/:id', updateAdmin);
router.delete('/admins/:id', deleteAdmin);

// Customer management routes
router.get('/customers', getAllCustomers);
router.post('/customers', createCustomer);
router.post('/customers/find-or-create', findOrCreateCustomer); 

// System statistics
router.get('/stats', getSystemStats);

module.exports = router;
