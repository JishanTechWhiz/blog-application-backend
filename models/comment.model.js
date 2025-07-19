// comment.model.js

module.exports = (sequelize, DataTypes) => {
  return sequelize.define("Comment", {
    comment: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    post_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    author_id: {
      type: DataTypes.INTEGER,
      allowNull: true
    }
  }, {
    tableName: "tbl_comments",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at"
  });
};
