const express = require('express');
const router = express.Router();
const {
  createBooking,
  getAllBookings,
  getBooking,
  updateBooking,
  cancelBooking,
  getAvailableSlots,
  updateBookingStatus,      // ← ADD
  updatePaymentStatus,      // ← ADD
  quickUpdateBooking 
} = require('../controllers/bookingController');
const { protect } = require('../middleware/auth');
const { bookingValidation, validate } = require('../middleware/validation');



// Public routes
router.get('/available-slots/:fieldId/:date', getAvailableSlots);

// Protected routes
router.post('/', protect, bookingValidation, validate, createBooking);
router.get('/', protect, getAllBookings);
router.get('/:id', protect, getBooking);
router.put('/:id', protect, updateBooking);
router.put('/:id/cancel', protect, cancelBooking);

// ⭐ NEW: Status update routes
router.put('/:id/status', updateBookingStatus);              // Update booking status only
router.put('/:id/payment-status', updatePaymentStatus);      // Update payment status only
router.put('/:id/quick-update', quickUpdateBooking);         // Update both at once

module.exports = router;
