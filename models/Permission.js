const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Permission = sequelize.define('Permission', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    comment: 'Permission name (e.g., view_fields, create_fields)'
  },
  displayName: {
    type: DataTypes.STRING(100),
    allowNull: false,
    field: 'display_name',
    comment: 'Human-readable name (e.g., Xem danh sách sân)'
  },
  description: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: 'Description of the permission'
  },
  category: {
    type: DataTypes.ENUM('fields', 'bookings', 'users', 'stats', 'settings'),
    allowNull: false,
    comment: 'Category of permission for grouping'
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'is_active'
  }
}, {
  tableName: 'permissions',
  timestamps: true,
  underscored: true
});

module.exports = Permission;
