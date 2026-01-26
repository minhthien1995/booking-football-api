const { body, validationResult } = require('express-validator');

// Middleware to check validation errors
exports.validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array().map(err => ({
        field: err.path,
        message: err.msg
      }))
    });
  }
  next();
};

// Validation rules for user registration
exports.registerValidation = [
  body('fullName')
    .trim()
    .notEmpty().withMessage('Họ tên không được để trống')
    .isLength({ min: 2, max: 100 }).withMessage('Họ tên phải từ 2-100 ký tự'),
  
  body('email')
    .trim()
    .notEmpty().withMessage('Email không được để trống')
    .isEmail().withMessage('Email không hợp lệ')
    .normalizeEmail(),
  
  body('password')
    .notEmpty().withMessage('Mật khẩu không được để trống')
    .isLength({ min: 6 }).withMessage('Mật khẩu phải có ít nhất 6 ký tự'),
  
  body('phone')
    .optional()
    .matches(/^[0-9]{10,11}$/).withMessage('Số điện thoại không hợp lệ')
];

// Validation rules for login
exports.loginValidation = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email không được để trống')
    .isEmail().withMessage('Email không hợp lệ'),
  
  body('password')
    .notEmpty().withMessage('Mật khẩu không được để trống')
];

// Validation rules for field creation
exports.fieldValidation = [
  body('name')
    .trim()
    .notEmpty().withMessage('Tên sân không được để trống')
    .isLength({ max: 100 }).withMessage('Tên sân không quá 100 ký tự'),
  
  body('fieldType')
    .notEmpty().withMessage('Loại sân không được để trống')
    .isIn(['5vs5', '7vs7', '11vs11']).withMessage('Loại sân không hợp lệ'),
  
  body('location')
    .trim()
    .notEmpty().withMessage('Địa chỉ không được để trống'),
  
  body('pricePerHour')
    .notEmpty().withMessage('Giá thuê không được để trống')
    .isFloat({ min: 0 }).withMessage('Giá thuê phải là số dương'),
  
  body('openTime')
    .optional()
    .matches(/^([01]\d|2[0-3]):([0-5]\d)$/).withMessage('Giờ mở cửa không hợp lệ (HH:MM)'),
  
  body('closeTime')
    .optional()
    .matches(/^([01]\d|2[0-3]):([0-5]\d)$/).withMessage('Giờ đóng cửa không hợp lệ (HH:MM)')
];

// Validation rules for booking
exports.bookingValidation = [
  body('fieldId')
    .notEmpty().withMessage('ID sân không được để trống')
    .isInt().withMessage('ID sân không hợp lệ'),
  
  body('bookingDate')
    .notEmpty().withMessage('Ngày đặt sân không được để trống')
    .isDate().withMessage('Ngày đặt sân không hợp lệ'),
  
  body('startTime')
    .notEmpty().withMessage('Giờ bắt đầu không được để trống')
    .matches(/^([01]\d|2[0-3]):([0-5]\d)$/).withMessage('Giờ bắt đầu không hợp lệ (HH:MM)'),
  
  body('duration')
    .notEmpty().withMessage('Thời gian thuê không được để trống')
    .isInt({ min: 1, max: 12 }).withMessage('Thời gian thuê từ 1-12 giờ')
];
