const { UserRole, RolePermission, Permission, User } = require('../models');
const { Op } = require('sequelize');

// @desc    Get all custom roles
// @route   GET /api/roles
// @access  Private/Superadmin
exports.getAllRoles = async (req, res) => {
  try {
    const { isActive } = req.query;

    const whereClause = {};
    if (isActive !== undefined) {
      whereClause.isActive = isActive === 'true';
    }

    const roles = await UserRole.findAll({
      where: whereClause,
      include: [
        {
          model: Permission,
          as: 'permissions',
          through: { attributes: [] },
          attributes: ['id', 'name', 'displayName', 'category']
        },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'fullName', 'email']
        },
        {
          model: User,
          as: 'users',
          attributes: ['id', 'fullName', 'email']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.status(200).json({
      success: true,
      count: roles.length,
      data: roles
    });
  } catch (error) {
    console.error('Get all roles error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy danh sách role'
    });
  }
};

// @desc    Get single role
// @route   GET /api/roles/:id
// @access  Private/Superadmin
exports.getRole = async (req, res) => {
  try {
    const role = await UserRole.findByPk(req.params.id, {
      include: [
        {
          model: Permission,
          as: 'permissions',
          through: { attributes: [] }
        },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'fullName', 'email']
        },
        {
          model: User,
          as: 'users',
          attributes: ['id', 'fullName', 'email', 'isActive']
        }
      ]
    });

    if (!role) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy role'
      });
    }

    res.status(200).json({
      success: true,
      data: role
    });
  } catch (error) {
    console.error('Get role error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy thông tin role'
    });
  }
};

// @desc    Create custom role
// @route   POST /api/roles
// @access  Private/Superadmin
exports.createRole = async (req, res) => {
  try {
    const { name, displayName, description, permissionIds } = req.body;

    // Check if role name already exists
    const existingRole = await UserRole.findOne({ where: { name } });
    if (existingRole) {
      return res.status(400).json({
        success: false,
        message: 'Tên role đã tồn tại'
      });
    }

    // Validate permissions
    if (permissionIds && permissionIds.length > 0) {
      const permissions = await Permission.findAll({
        where: { id: permissionIds }
      });

      if (permissions.length !== permissionIds.length) {
        return res.status(400).json({
          success: false,
          message: 'Một số permission không tồn tại'
        });
      }
    }

    // Create role
    const role = await UserRole.create({
      name,
      displayName,
      description,
      createdBy: req.user.id
    });

    // Assign permissions to role
    if (permissionIds && permissionIds.length > 0) {
      await Promise.all(
        permissionIds.map(permissionId =>
          RolePermission.create({
            roleId: role.id,
            permissionId
          })
        )
      );
    }

    // Get role with permissions
    const roleWithPermissions = await UserRole.findByPk(role.id, {
      include: [
        {
          model: Permission,
          as: 'permissions',
          through: { attributes: [] }
        }
      ]
    });

    res.status(201).json({
      success: true,
      message: 'Tạo role thành công',
      data: roleWithPermissions
    });
  } catch (error) {
    console.error('Create role error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi tạo role'
    });
  }
};

// @desc    Update custom role
// @route   PUT /api/roles/:id
// @access  Private/Superadmin
exports.updateRole = async (req, res) => {
  try {
    const role = await UserRole.findByPk(req.params.id);

    if (!role) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy role'
      });
    }

    const { name, displayName, description, isActive, permissionIds } = req.body;

    // Check if new name conflicts with existing role
    if (name && name !== role.name) {
      const existingRole = await UserRole.findOne({ where: { name } });
      if (existingRole) {
        return res.status(400).json({
          success: false,
          message: 'Tên role đã tồn tại'
        });
      }
      role.name = name;
    }

    if (displayName !== undefined) role.displayName = displayName;
    if (description !== undefined) role.description = description;
    if (isActive !== undefined) role.isActive = isActive;

    await role.save();

    // Update permissions if provided
    if (permissionIds) {
      // Validate permissions
      const permissions = await Permission.findAll({
        where: { id: permissionIds }
      });

      if (permissions.length !== permissionIds.length) {
        return res.status(400).json({
          success: false,
          message: 'Một số permission không tồn tại'
        });
      }

      // Delete old permissions
      await RolePermission.destroy({ where: { roleId: role.id } });

      // Add new permissions
      if (permissionIds.length > 0) {
        await Promise.all(
          permissionIds.map(permissionId =>
            RolePermission.create({
              roleId: role.id,
              permissionId
            })
          )
        );
      }
    }

    // Get updated role with permissions
    const updatedRole = await UserRole.findByPk(role.id, {
      include: [
        {
          model: Permission,
          as: 'permissions',
          through: { attributes: [] }
        },
        {
          model: User,
          as: 'users',
          attributes: ['id', 'fullName', 'email']
        }
      ]
    });

    res.status(200).json({
      success: true,
      message: 'Cập nhật role thành công',
      data: updatedRole
    });
  } catch (error) {
    console.error('Update role error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi cập nhật role'
    });
  }
};

// @desc    Delete custom role
// @route   DELETE /api/roles/:id
// @access  Private/Superadmin
exports.deleteRole = async (req, res) => {
  try {
    const role = await UserRole.findByPk(req.params.id);

    if (!role) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy role'
      });
    }

    // Check if any users are using this role
    const usersCount = await User.count({ where: { customRoleId: role.id } });
    if (usersCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Không thể xóa role. Có ${usersCount} user đang sử dụng role này`
      });
    }

    // Delete role permissions
    await RolePermission.destroy({ where: { roleId: role.id } });

    // Delete role
    await role.destroy();

    res.status(200).json({
      success: true,
      message: 'Xóa role thành công'
    });
  } catch (error) {
    console.error('Delete role error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi xóa role'
    });
  }
};

// @desc    Assign role to user
// @route   POST /api/roles/assign
// @access  Private/Superadmin
exports.assignRoleToUser = async (req, res) => {
  try {
    const { userId, roleId } = req.body;

    // Check if user exists
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy user'
      });
    }

    // Only assign to admin users
    if (user.role !== 'admin') {
      return res.status(400).json({
        success: false,
        message: 'Chỉ có thể gán role cho Admin users'
      });
    }

    // Check if role exists
    const role = await UserRole.findByPk(roleId);
    if (!role) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy role'
      });
    }

    if (!role.isActive) {
      return res.status(400).json({
        success: false,
        message: 'Role này đã bị vô hiệu hóa'
      });
    }

    // Assign role
    user.customRoleId = roleId;
    await user.save();

    // Get user with role
    const updatedUser = await User.findByPk(userId, {
      include: [{
        model: UserRole,
        as: 'customRole',
        include: [{
          model: Permission,
          as: 'permissions',
          through: { attributes: [] }
        }]
      }]
    });

    res.status(200).json({
      success: true,
      message: 'Gán role thành công',
      data: updatedUser
    });
  } catch (error) {
    console.error('Assign role error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi gán role'
    });
  }
};

// @desc    Remove role from user
// @route   POST /api/roles/unassign
// @access  Private/Superadmin
exports.unassignRoleFromUser = async (req, res) => {
  try {
    const { userId } = req.body;

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy user'
      });
    }

    user.customRoleId = null;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Gỡ role thành công',
      data: user
    });
  } catch (error) {
    console.error('Unassign role error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi gỡ role'
    });
  }
};

// @desc    Clone role
// @route   POST /api/roles/:id/clone
// @access  Private/Superadmin
exports.cloneRole = async (req, res) => {
  try {
    const { newName, newDisplayName } = req.body;

    const originalRole = await UserRole.findByPk(req.params.id, {
      include: [{
        model: Permission,
        as: 'permissions',
        through: { attributes: [] }
      }]
    });

    if (!originalRole) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy role gốc'
      });
    }

    // Check if new name exists
    const existing = await UserRole.findOne({ where: { name: newName } });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Tên role mới đã tồn tại'
      });
    }

    // Create new role
    const newRole = await UserRole.create({
      name: newName,
      displayName: newDisplayName || `${originalRole.displayName} (Copy)`,
      description: originalRole.description,
      createdBy: req.user.id
    });

    // Copy permissions
    const permissionIds = originalRole.permissions.map(p => p.id);
    if (permissionIds.length > 0) {
      await Promise.all(
        permissionIds.map(permissionId =>
          RolePermission.create({
            roleId: newRole.id,
            permissionId
          })
        )
      );
    }

    // Get new role with permissions
    const clonedRole = await UserRole.findByPk(newRole.id, {
      include: [{
        model: Permission,
        as: 'permissions',
        through: { attributes: [] }
      }]
    });

    res.status(201).json({
      success: true,
      message: 'Nhân bản role thành công',
      data: clonedRole
    });
  } catch (error) {
    console.error('Clone role error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi nhân bản role'
    });
  }
};
