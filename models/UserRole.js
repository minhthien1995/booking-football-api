const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const UserRole = sequelize.define('UserRole', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    comment: 'Role name (e.g., customAdmin, fieldManager)'
  },
  displayName: {
    type: DataTypes.STRING(100),
    allowNull: false,
    field: 'display_name',
    comment: 'Human-readable name (e.g., Quản lý tùy chỉnh)'
  },
  description: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: 'Description of the role'
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'is_active'
  },
  createdBy: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'created_by',
    references: {
      model: 'users',
      key: 'id'
    },
    comment: 'Superadmin who created this role'
  }
}, {
  tableName: 'user_roles',
  timestamps: true,
  underscored: true
});

module.exports = UserRole;
