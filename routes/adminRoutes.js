const express = require('express');
const router = express.Router();
const {
  getAllUsers,
  getUser,
  updateUser,
  deleteUser,
  getStats
} = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/auth');

// All routes are protected and admin/superadmin only
router.use(protect);
router.use(authorize('admin', 'superadmin'));

router.get('/users', getAllUsers);
router.get('/users/:id', getUser);
router.put('/users/:id', updateUser);
router.delete('/users/:id', deleteUser);
router.get('/stats', getStats);

module.exports = router;
