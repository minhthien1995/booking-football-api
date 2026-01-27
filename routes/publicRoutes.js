const express = require('express');
const router = express.Router();
const {
  getPublicFields,
  getPublicField,
  getAvailableSlots,
  findOrCreateCustomer,
  createPublicBooking,
  findAvailableFields
} = require('../controllers/publicController');

// Public endpoints (NO authentication required)

// Fields
router.get('/fields', getPublicFields);                            // Get all active fields
router.get('/fields/:id', getPublicField);                         // Get single field
router.get('/fields/:fieldId/slots/:date', getAvailableSlots);    // Get available time slots
router.get('/fields/search-available', findAvailableFields);      // Find available fields by date and time

// Customers
router.post('/customers/find-or-create', findOrCreateCustomer);

// Create public booking
router.post('/bookings', createPublicBooking);

// Bookings
router.post('/bookings', createPublicBooking);  

module.exports = router;