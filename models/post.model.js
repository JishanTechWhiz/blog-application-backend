// post.model.js

module.exports = (sequelize, DataTypes) => {
  return sequelize.define("Post", {
    title: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    image_url: DataTypes.STRING(255),
    author_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    category_id: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    is_active: {
      type: DataTypes.TINYINT,
      defaultValue: 1
    },
    is_deleted: {
      type: DataTypes.TINYINT,
      defaultValue: 0
    }
  }, {
    tableName: "tbl_posts",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at"
  });
};