const express = require('express');
const router = express.Router();
const {
  getAllFields,
  getField,
  createField,
  updateField,
  deleteField
} = require('../controllers/fieldController');
const { protect, authorize } = require('../middleware/auth');
const { checkPermission } = require('../middleware/permission');
const { fieldValidation, validate } = require('../middleware/validation');

// Public routes
router.get('/', getAllFields);
router.get('/:id', getField);

// Protected routes (Admin and Superadmin with permissions)
router.post(
  '/',
  protect,
  authorize('admin', 'superadmin'),
  checkPermission('create_fields'),
  fieldValidation,
  validate,
  createField
);

router.put(
  '/:id',
  protect,
  authorize('admin', 'superadmin'),
  checkPermission('edit_fields'),
  updateField
);

router.delete(
  '/:id',
  protect,
  authorize('admin', 'superadmin'),
  checkPermission('delete_fields'),
  deleteField
);

module.exports = router;
