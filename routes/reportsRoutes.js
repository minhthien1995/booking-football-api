const express = require('express');
const router = express.Router();
const {
  getOverviewReport,
  getRevenueByDate,
  getFieldPerformance,
  getCustomerReport,
  getTimeSlotAnalysis
} = require('../controllers/reportsController');
const { protect, authorize } = require('../middleware/auth');

// Bảo vệ tất cả routes - chỉ admin và superadmin
router.use(protect);
router.use(authorize('superadmin', 'admin'));

// Định nghĩa 5 endpoints
router.get('/overview', getOverviewReport);
router.get('/revenue-by-date', getRevenueByDate);
router.get('/field-performance', getFieldPerformance);
router.get('/customers', getCustomerReport);
router.get('/time-slots', getTimeSlotAnalysis);

module.exports = router;