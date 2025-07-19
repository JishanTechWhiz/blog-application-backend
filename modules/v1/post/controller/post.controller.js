const db = require("../../../../models");
const { custom_code } = require("../../../../utilities/response_error_code");
const {
  createPostSchema,
  updatePostSchema,
} = require("../../../../modules/v1/validators/post.validator");

class Post_Controller {
  /* ------------------------------- CREATE POST ----------------------- */
  createPost = async (req, res) => {
    try {
      const { error, value } = createPostSchema.validate(req.body);

      if (error) {
        return res.status(400).json({
          code: custom_code.VALIDATION_FAILED,
          message: error.details[0].message,
        });
      }

      const user_id = req.user?.id;

      if (!user_id) {
        return res.status(401).json({
          code: custom_code.UNAUTHORIZED,
          message: "Unauthorized User Access",
        });
      }

      const { title, content, image_url, category_id } = value;
      const author_id = user_id;

      const categoryExists = await db.Category.findByPk(category_id);
      if (!categoryExists) {
        return res.status(400).json({
          code: custom_code.VALIDATION_FAILED,
          message: "Invalid category ID. Category does not exist.",
        });
      }

      const post = await db.Post.create({
        title,
        content,
        image_url,
        category_id,
        author_id,
      });

      return res.status(201).json({
        code: custom_code.SUCCESS,
        message: "Post created successfully",
        data: post,
      });
    } catch (err) {
      console.error("Create Post Error:", err);
      return res.status(500).json({
        code: custom_code.OPERATION_FAILED,
        message: "Something went wrong",
      });
    }
  };

  /* ------------------------------- GET ALL POSTS --------------------- */
  getAllPosts = async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1; // default to page 1
      const limit = 10;
      const offset = (page - 1) * limit;

      const { count, rows: posts } = await db.Post.findAndCountAll({
        where: { is_deleted: 0 },
        include: [
          {
            model: db.User,
            as: "author",
            attributes: ["id", "username", "email"],
          },
        ],
        order: [["created_at", "DESC"]],
        limit,
        offset,
      });

      if (offset >= count && count > 0) {
        return res.status(400).json({
          code: custom_code.INVALID_PAGE,
          message: "Requested page is out of range",
        });
      }

      return res.status(200).json({
        code: custom_code.SUCCESS,
        data: posts,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(count / limit),
          totalPosts: count,
        },
      });
    } catch (err) {
      console.error("Get Posts Error:", err);
      return res.status(500).json({
        code: custom_code.OPERATION_FAILED,
        message: "Something went wrong",
      });
    }
  };

  /* ------------------------------- GET POST BY ID -------------------- */
  getPostById = async (req, res) => {
    try {
      const { id } = req.params;

      //validate post id is numeric
      if (isNaN(id)) {
        return res.status(400).json({
          code: custom_code.VALIDATION_FAILED,
          message: "Invalid post ID",
        });
      }

      const post = await db.Post.findOne({
        where: { id, is_deleted: 0 },
        include: [
          {
            model: db.User,
            as: "author",
            attributes: ["id", "username", "email"],
          },
        ],
      });

      if (!post) {
        return res.status(404).json({
          code: custom_code.NO_DATA_FOUND,
          message: "Post not found",
        });
      }

      return res.status(200).json({
        code: custom_code.SUCCESS,
        data: post,
      });
    } catch (err) {
      console.error("Get Post Error:", err);
      return res.status(500).json({
        code: custom_code.OPERATION_FAILED,
        message: "Something went wrong",
      });
    }
  };

  /* ------------------------------- GET POST BY CATEGORY NAME -------------------- */
  getAllPostsByCategoryName = async (req, res) => {
    try {
      const { category_name, page = 1 } = req.query;
      const limit = 6;
      const offset = (parseInt(page) - 1) * limit;

      if (!category_name) {
        return res.status(400).json({
          code: custom_code.MISSING_FIELDS,
          message: "category_name is required",
        });
      }

      const { count, rows: posts } = await db.Post.findAndCountAll({
        where: { is_deleted: 0 },
        include: [
          {
            model: db.Category,
            where: { name: category_name },
            attributes: ["id", "name"],
          },
          {
            model: db.User,
            as: "author",
            attributes: ["id", "username", "email"],
          },
        ],
        order: [["created_at", "DESC"]],
        limit,
        offset,
      });

      if (offset >= count && count > 0) {
        return res.status(400).json({
          code: custom_code.INVALID_PAGE,
          message: "Requested page is out of range",
        });
      }

      if (posts.length === 0) {
        return res.status(404).json({
          code: custom_code.NO_DATA_FOUND,
          message: `No posts found in category '${category_name}'`,
        });
      }

      return res.status(200).json({
        code: custom_code.SUCCESS,
        data: posts,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(count / limit),
          totalPosts: count,
        },
      });
    } catch (err) {
      console.error("Get Posts by Category Name Error:", err);
      return res.status(500).json({
        code: custom_code.OPERATION_FAILED,
        message: "Something went wrong",
      });
    }
  };

  /* ------------------------------- UPDATE POST ----------------------- */
  updatePost = async (req, res) => {
    try {
      const { error, value } = updatePostSchema.validate(req.body);
      if (error) {
        return res.status(400).json({
          code: custom_code.VALIDATION_FAILED,
          message: error.details[0].message,
        });
      }

      const { id } = req.params;
      const author_id = req.user?.id;

      const post = await db.Post.findOne({
        where: { id, author_id, is_deleted: 0 },
      });
      if (!post) {
        return res.status(404).json({
          code: custom_code.NO_DATA_FOUND,
          message: "Post not found or unauthorized",
        });
      }

      await post.update(value);

      return res.status(200).json({
        code: custom_code.SUCCESS,
        message: "Post updated successfully",
        data: post,
      });
    } catch (err) {
      console.error("Update Post Error:", err);
      return res.status(500).json({
        code: custom_code.OPERATION_FAILED,
        message: "Something went wrong",
      });
    }
  };

  /* ------------------------------- DELETE POST (SOFT) ---------------- */
  softDeletePost = async (req, res) => {
    try {
      const { id } = req.params;
      const author_id = req.user?.id;

      const post = await db.Post.findOne({
        where: { id, author_id, is_deleted: 0 },
      });
      if (!post) {
        return res.status(404).json({
          code: custom_code.NO_DATA_FOUND,
          message: "Post not found or unauthorized",
        });
      }

      await post.update({ is_deleted: 1 });

      return res.status(200).json({
        code: custom_code.SUCCESS,
        message: "Post deleted successfully",
        data: {
          id: post.id,
          title: post.title,
          deletedAt: new Date(),
        },
      });
    } catch (err) {
      console.error("Delete Post Error:", err);
      return res.status(500).json({
        code: custom_code.OPERATION_FAILED,
        message: "Something went wrong",
      });
    }
  };

  /* ------------------------------- DELETE POST (HARD) ---------------- */
  hardDeletePost = async (req, res) => {
    try {
      const { id } = req.params;
      const author_id = req.user?.id;

      const post = await db.Post.findOne({ where: { id, author_id } });

      if (!post) {
        return res.status(404).json({
          code: custom_code.NO_DATA_FOUND,
          message: "Post not found or unauthorized",
        });
      }

      await post.destroy(); // Hard delete

      return res.status(200).json({
        code: custom_code.SUCCESS,
        message: "Post permanently deleted",
        data: {
          id: post.id,
          title: post.title,
        },
      });
    } catch (err) {
      console.error("Hard Delete Post Error:", err);
      return res.status(500).json({
        code: custom_code.OPERATION_FAILED,
        message: "Something went wrong",
      });
    }
  };
}

module.exports = new Post_Controller();
