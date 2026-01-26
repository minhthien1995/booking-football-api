const express = require('express');
const router = express.Router();
const {
  getAllRoles,
  getRole,
  createRole,
  updateRole,
  deleteRole,
  assignRoleToUser,
  unassignRoleFromUser,
  cloneRole
} = require('../controllers/roleController');
const { protect, authorize } = require('../middleware/auth');

// All routes are protected and superadmin only
router.use(protect);
router.use(authorize('superadmin'));

// CRUD routes
router.get('/', getAllRoles);
router.get('/:id', getRole);
router.post('/', createRole);
router.put('/:id', updateRole);
router.delete('/:id', deleteRole);

// Assign/Unassign role to/from user
router.post('/assign', assignRoleToUser);
router.post('/unassign', unassignRoleFromUser);

// Clone role
router.post('/:id/clone', cloneRole);

module.exports = router;
