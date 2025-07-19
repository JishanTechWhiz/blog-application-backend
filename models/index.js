const { Sequelize, DataTypes } = require("sequelize");
const dbConfig = require("../config/db.config");

const sequelize = new Sequelize(
  dbConfig.DB,
  dbConfig.USER,
  dbConfig.PASSWORD,
  {
    host: dbConfig.HOST,
    dialect: dbConfig.dialect,
    pool: dbConfig.pool
  }
);

const db = {};
db.Sequelize = Sequelize;
db.sequelize = sequelize;

db.User = require("./user.model")(sequelize, DataTypes);
db.Category = require("./category.model")(sequelize, DataTypes);
db.Post = require("./post.model")(sequelize, DataTypes);
db.Comment = require("./comment.model")(sequelize, DataTypes);

// Associations

// User - Post
db.User.hasMany(db.Post, { foreignKey: "author_id" });
db.Post.belongsTo(db.User, { foreignKey: "author_id", as: "author" });


// Category - Post
db.Category.hasMany(db.Post, { foreignKey: "category_id" });
db.Post.belongsTo(db.Category, { foreignKey: "category_id" });



// User - Comment
db.User.hasMany(db.Comment, { foreignKey: "author_id" });
db.Comment.belongsTo(db.User, { foreignKey: "author_id" });

// Post - Comment
db.Post.hasMany(db.Comment, { foreignKey: "post_id" });
db.Comment.belongsTo(db.Post, { foreignKey: "post_id" });

module.exports = db;
