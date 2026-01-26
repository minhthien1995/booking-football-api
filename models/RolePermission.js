const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const RolePermission = sequelize.define('RolePermission', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  roleId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'role_id',
    references: {
      model: 'user_roles',
      key: 'id'
    }
  },
  permissionId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'permission_id',
    references: {
      model: 'permissions',
      key: 'id'
    }
  }
}, {
  tableName: 'role_permissions',
  timestamps: false,
  underscored: true,
  indexes: [
    {
      unique: true,
      fields: ['role_id', 'permission_id'],
      name: 'unique_role_permission'
    }
  ]
});

module.exports = RolePermission;
