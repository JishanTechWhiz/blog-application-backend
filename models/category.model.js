// category.model.js

module.exports = (sequelize, DataTypes) => {
  return sequelize.define("Category", {
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true
    },
    is_active: {
      type: DataTypes.TINYINT,
      defaultValue: 1
    }
  }, {
    tableName: "tbl_categories",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: false
  });
};
