// user.model.js

module.exports = (sequelize, DataTypes) => {
  return sequelize.define("User", {
    fullname: DataTypes.STRING(100),
    username: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
    },
    email: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    country_code: DataTypes.STRING(10),
    phone: DataTypes.STRING(20),
    profile_pic: DataTypes.STRING(255),
    login_type: {
      type: DataTypes.ENUM('social', 'normal'),
      defaultValue: 'normal'
    },
    social_id: DataTypes.STRING(255),
    is_active: {
      type: DataTypes.TINYINT,
      defaultValue: 1
    },
    is_verified: {
      type: DataTypes.TINYINT,
      defaultValue: 0
    },
    is_login: {
      type: DataTypes.TINYINT,
      defaultValue: 0
    },
    is_deleted: {
      type: DataTypes.TINYINT,
      defaultValue: 0
    },
    step: {
      type: DataTypes.TINYINT,
      defaultValue: 0
    },
    
  }, {
    tableName: "tbl_user",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at"
  });
};