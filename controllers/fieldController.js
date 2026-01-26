const { Field } = require('../models');
const { Op } = require('sequelize');

// @desc    Get all fields
// @route   GET /api/fields
// @access  Public
exports.getAllFields = async (req, res) => {
  try {
    const { fieldType, isActive, search } = req.query;

    // Build filter conditions
    const whereClause = {};

    if (fieldType) {
      whereClause.fieldType = fieldType;
    }

    if (isActive !== undefined) {
      whereClause.isActive = isActive === 'true';
    }

    if (search) {
      whereClause[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { location: { [Op.like]: `%${search}%` } }
      ];
    }

    const fields = await Field.findAll({
      where: whereClause,
      order: [['createdAt', 'DESC']]
    });

    res.status(200).json({
      success: true,
      count: fields.length,
      data: fields
    });
  } catch (error) {
    console.error('Get all fields error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy danh sách sân'
    });
  }
};

// @desc    Get single field
// @route   GET /api/fields/:id
// @access  Public
exports.getField = async (req, res) => {
  try {
    const field = await Field.findByPk(req.params.id);

    if (!field) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy sân'
      });
    }

    res.status(200).json({
      success: true,
      data: field
    });
  } catch (error) {
    console.error('Get field error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy thông tin sân'
    });
  }
};

// @desc    Create new field
// @route   POST /api/fields
// @access  Private/Admin
exports.createField = async (req, res) => {
  try {
    const { name, fieldType, location, pricePerHour, description, image, openTime, closeTime } = req.body;

    const field = await Field.create({
      name,
      fieldType,
      location,
      pricePerHour,
      description,
      image,
      openTime,
      closeTime
    });

    res.status(201).json({
      success: true,
      message: 'Tạo sân thành công',
      data: field
    });
  } catch (error) {
    console.error('Create field error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi tạo sân'
    });
  }
};

// @desc    Update field
// @route   PUT /api/fields/:id
// @access  Private/Admin
exports.updateField = async (req, res) => {
  try {
    const field = await Field.findByPk(req.params.id);

    if (!field) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy sân'
      });
    }

    const { name, fieldType, location, pricePerHour, description, image, openTime, closeTime, isActive } = req.body;

    // Update fields
    if (name !== undefined) field.name = name;
    if (fieldType !== undefined) field.fieldType = fieldType;
    if (location !== undefined) field.location = location;
    if (pricePerHour !== undefined) field.pricePerHour = pricePerHour;
    if (description !== undefined) field.description = description;
    if (image !== undefined) field.image = image;
    if (openTime !== undefined) field.openTime = openTime;
    if (closeTime !== undefined) field.closeTime = closeTime;
    if (isActive !== undefined) field.isActive = isActive;

    await field.save();

    res.status(200).json({
      success: true,
      message: 'Cập nhật sân thành công',
      data: field
    });
  } catch (error) {
    console.error('Update field error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi cập nhật sân'
    });
  }
};

// @desc    Delete field
// @route   DELETE /api/fields/:id
// @access  Private/Admin
exports.deleteField = async (req, res) => {
  try {
    const field = await Field.findByPk(req.params.id);

    if (!field) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy sân'
      });
    }

    await field.destroy();

    res.status(200).json({
      success: true,
      message: 'Xóa sân thành công'
    });
  } catch (error) {
    console.error('Delete field error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi xóa sân'
    });
  }
};
