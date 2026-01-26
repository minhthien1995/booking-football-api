const express = require('express');
const router = express.Router();
const {
  getAllPermissions,
  getUserPermissions,
  grantPermission,
  grantMultiplePermissions,
  revokePermission,
  revokeAllPermissions,
  syncUserPermissions
} = require('../controllers/permissionController');
const { protect, authorize } = require('../middleware/auth');

// All routes are protected and superadmin only
router.use(protect);
router.use(authorize('superadmin'));

// Get all available permissions
router.get('/', getAllPermissions);

// Get user's permissions
router.get('/user/:userId', getUserPermissions);

// Grant permission(s)
router.post('/grant', grantPermission);
router.post('/grant-multiple', grantMultiplePermissions);

// Revoke permission(s)
router.delete('/revoke', revokePermission);
router.delete('/revoke-all/:userId', revokeAllPermissions);

// Sync permissions (replace all)
router.post('/sync/:userId', syncUserPermissions);

module.exports = router;
