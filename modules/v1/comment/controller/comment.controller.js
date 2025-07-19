const db = require("../../../../models");
const { custom_code } = require("../../../../utilities/response_error_code");
const {
  createCommentSchema,
  updateCommentSchema,
} = require("../../validators/comment.validator");

class Comment_Controller {
  /* ---------------- Create Comment --------------- */
  createComment = async (req, res) => {
    try {
      const { error, value } = createCommentSchema.validate(req.body);
      if (error) {
        return res.status(400).json({
          code: custom_code.VALIDATION_FAILED,
          message: error.message,
        });
      }

      const user_id = req.user?.id;
      if (!user_id) {
        return res.status(401).json({
          code: custom_code.UNAUTHORIZED,
          message: "Unauthorized user access",
        });
      }

      /* Ensure the post exists (and isn’t deleted) */
      const post = await db.Post.findOne({
        where: { id: value.post_id, is_deleted: 0 },
      });

      if (!post) {
        return res.status(404).json({
          code: custom_code.NO_DATA_FOUND,
          message: "Post not found",
        });
      }

      const comment = await db.Comment.create({
        comment: value.comment,
        post_id: value.post_id,
        author_id: user_id,
      });

      return res.status(201).json({
        code: custom_code.SUCCESS,
        message: "Comment created successfully",
        data: comment,
      });
    } catch (err) {
      console.error("Create Comment Error:", err);
      return res.status(500).json({
        code: custom_code.OPERATION_FAILED,
        message: "Something went wrong",
      });
    }
  };

  /* ---------------- Get Comments by Post ID --------------- */
  getComments = async (req, res) => {
    try {
      const { post_id } = req.query;
      const page = parseInt(req.query.page) || 1;
      const limit = 10;
      const offset = (page - 1) * limit;

      if (!post_id || isNaN(post_id)) {
        return res.status(400).json({
          code: custom_code.OPERATION_FAILED,
          message: "post_id is required and must be a valid number",
        });
      }

      // Check if post exists
      const post = await db.Post.findOne({
        where: { id: post_id, is_deleted: 0 },
      });

      if (!post) {
        return res.status(404).json({
          code: custom_code.NO_DATA_FOUND,
          message: "Post not found",
        });
      }

      // Get paginated comments
      const { count, rows: comments } = await db.Comment.findAndCountAll({
        where: { post_id },
        include: [{ model: db.User, attributes: ["id", "username", "email"] }],
        order: [["created_at", "DESC"]],
        limit,
        offset,
      });

      if (count === 0) {
        return res.status(404).json({
          code: custom_code.NO_DATA_FOUND,
          message: "No comments found for this post",
        });
      }

      if (offset >= count && count > 0) {
        return res.status(400).json({
          code: custom_code.INVALID_PAGE,
          message: "Requested page is out of range",
        });
      }

      return res.status(200).json({
        code: custom_code.SUCCESS,
        data: comments,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(count / limit),
          totalComments: count,
        },
      });
    } catch (err) {
      console.error("Get Comments Error:", err);
      return res.status(500).json({
        code: custom_code.OPERATION_FAILED,
        message: "Something went wrong",
      });
    }
  };

  /* ---------------- Get Comment by ID --------------- */
  getCommentById = async (req, res) => {
    try {
      const { id } = req.params;

      if (!id || isNaN(id)) {
        return res.status(400).json({
          code: custom_code.VALIDATION_FAILED,
          message: "Comment ID must be a valid number",
        });
      }

      const comment = await db.Comment.findOne({
        where: { id },
        include: [{ model: db.User, attributes: ["id", "username", "email"] }],
      });

      if (!comment) {
        return res.status(404).json({
          code: custom_code.NO_DATA_FOUND,
          message: "Comment not found",
        });
      }

      return res.status(200).json({ code: custom_code.SUCCESS, data: comment });
    } catch (err) {
      console.error("Get Comment Error:", err);
      return res.status(500).json({
        code: custom_code.OPERATION_FAILED,
        message: "Something went wrong",
      });
    }
  };

  /* ---------------- Update Comment --------------- */
  updateComment = async (req, res) => {
    try {
      const { error, value } = updateCommentSchema.validate(req.body);
      if (error) {
        return res.status(400).json({
          code: custom_code.VALIDATION_FAILED,
          message: error.message,
        });
      }

      const { id } = req.params;

      if (!id || isNaN(id)) {
        return res.status(400).json({
          code: custom_code.VALIDATION_FAILED,
          message: "Comment ID must be a valid number",
        });
      }

      const comment = await db.Comment.findOne({
        where: { id, author_id: req.user?.id },
      });

      if (!comment) {
        return res.status(404).json({
          code: custom_code.NO_DATA_FOUND,
          message: "Comment not found or unauthorized",
        });
      }

      await comment.update({ comment: value.comment });

      return res.status(200).json({
        code: custom_code.SUCCESS,
        message: "Comment updated successfully",
      });
    } catch (err) {
      console.error("Update Comment Error:", err);
      return res.status(500).json({
        code: custom_code.OPERATION_FAILED,
        message: "Something went wrong",
      });
    }
  };

  /* ---------------- Delete Comment --------------- */
  deleteComment = async (req, res) => {
    try {
      const { id } = req.params;

      if (!id || isNaN(id)) {
        return res.status(400).json({
          code: custom_code.VALIDATION_FAILED,
          message: "Comment ID must be a valid number",
        });
      }
      
      const comment = await db.Comment.findOne({
        where: { id, author_id: req.user?.id },
      });

      if (!comment) {
        return res.status(404).json({
          code: custom_code.NO_DATA_FOUND,
          message: "Comment not found or unauthorized",
        });
      }

      await comment.destroy();

      return res.status(200).json({
        code: custom_code.SUCCESS,
        message: "Comment deleted successfully",
      });
    } catch (err) {
      console.error("Delete Comment Error:", err);
      return res.status(500).json({
        code: custom_code.OPERATION_FAILED,
        message: "Something went wrong",
      });
    }
  };
}

module.exports = new Comment_Controller();
