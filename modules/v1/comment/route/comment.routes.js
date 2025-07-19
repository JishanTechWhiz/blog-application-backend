const commentController = require("../controller/comment.controller");
const {
  apiKeyMiddleware,
  jwtAuthMiddleware,
} = require("../../../../middleware/auth.middleware");

// custom Post route function : V1
const customRoutes = (app) => {
  //Add Comments
  /**
   * @swagger
   * /v1/comments/create-comments:
   *   post:
   *     summary: Add a comment to a blog post
   *     description: |
   *       This endpoint allows an authenticated user to add a comment to an existing blog post.
   *
   *       ## 🔐 **Authentication Required:**
   *       - API Key (Header: `x-api-key`)
   *       - JWT Token (Header: `Authorization: Bearer <token>`)
   *
   *       ## 📝 **Usage Guide:**
   *       - Include your API key in the `x-api-key` header.
   *       - Include your JWT token in the `Authorization` header as `Bearer <token>`.
   *       - Provide `post_id` and `comment` in the request body.
   *       - The comment will be saved only if the post exists and is not marked deleted.
   *       - The comment will be linked to the authenticated user (`req.user.id`).
   *
   *     tags:
   *       - Comments
   *     security:
   *       - ApiKeyAuth: []
   *       - JWTAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - post_id
   *               - comment
   *             properties:
   *               post_id:
   *                 type: integer
   *                 example: 15
   *                 description: The ID of the blog post to comment on.
   *               comment:
   *                 type: string
   *                 example: "This is a great post!"
   *                 description: The content of the comment.
   *     responses:
   *       201:
   *         description: Comment created successfully
   *         content:
   *           application/json:
   *             example:
   *               code: 200
   *               message: Comment created successfully
   *               data:
   *                 id: 101
   *                 comment: This is a great post!
   *                 post_id: 15
   *                 author_id: 42
   *                 created_at: "2025-07-19T13:00:00.000Z"
   *                 updated_at: "2025-07-19T13:00:00.000Z"
   *       400:
   *         description: Validation error or missing fields
   *         content:
   *           application/json:
   *             examples:
   *               validationError:
   *                 summary: Invalid request body
   *                 value:
   *                   code: 400
   *                   message: "\"comment\" is not allowed to be empty"
   *               missingFields:
   *                 summary: Missing post_id or comment
   *                 value:
   *                   code: 400
   *                   message: "\"post_id\" is required"
   *       401:
   *         description: Unauthorized - missing or invalid JWT
   *         content:
   *           application/json:
   *             example:
   *               code: 401
   *               message: Unauthorized user access
   *       404:
   *         description: Post not found or is deleted
   *         content:
   *           application/json:
   *             example:
   *               code: 404
   *               message: Post not found
   *       500:
   *         description: Server error
   *         content:
   *           application/json:
   *             example:
   *               code: 500
   *               message: Something went wrong
   */

  app.post(
    "/v1/comments/create-comments",
    apiKeyMiddleware,
    jwtAuthMiddleware,
    commentController.createComment
  );

  //Get Comments by Post ID
  /**
   * @swagger
   * /v1/comments/get-post-comments:
   *   get:
   *     summary: Get comments for a specific post
   *     description: |
   *       This endpoint retrieves a paginated list of comments associated with a specific blog post.
   *
   *       ## 🔐 **Authentication Required:**
   *       - API Key (Header: `x-api-key`)
   *
   *       ## 📝 **Usage Guide:**
   *       - Provide the `post_id` as a query parameter.
   *       - Pagination is supported using the `page` query parameter.
   *       - The response includes comment details and basic author info (user ID, username, email).
   *       - Default page size is 10 comments per page.
   *       - If `post_id` is invalid or not found, appropriate errors are returned.
   *
   *       ## ✅ **Example Request:**
   *       GET /v1/comments/get-post-comments?post_id=10&page=2
   *       Headers:
   *       - x-api-key: MyBlogAPIProject
   *
   *     tags:
   *       - Comments
   *     security:
   *       - ApiKeyAuth: []
   *     parameters:
   *       - in: query
   *         name: post_id
   *         required: true
   *         schema:
   *           type: integer
   *           example: 10
   *         description: ID of the blog post to fetch comments for.
   *       - in: query
   *         name: page
   *         required: false
   *         schema:
   *           type: integer
   *           default: 1
   *           example: 2
   *         description: Page number for paginated comments.
   *     responses:
   *       200:
   *         description: List of comments retrieved successfully
   *         content:
   *           application/json:
   *             example:
   *               code: 200
   *               data:
   *                 - id: 301
   *                   comment: "This post was very helpful!"
   *                   user:
   *                     id: 5
   *                     username: "john_doe"
   *                     email: "john@mail.com"
   *               pagination:
   *                 currentPage: 2
   *                 totalPages: 3
   *                 totalComments: 23
   *       400:
   *         description: Validation error or out-of-range page
   *         content:
   *           application/json:
   *             example:
   *               code: 400
   *               message: post_id is required and must be a valid number
   *       404:
   *         description: No comments found or post not found
   *         content:
   *           application/json:
   *             example:
   *               code: 404
   *               message: Post not found
   *       500:
   *         description: Internal server error
   *         content:
   *           application/json:
   *             example:
   *               code: 500
   *               message: Something went wrong
   */

  app.get(
    "/v1/comments/get-post-comments",
    apiKeyMiddleware,
    commentController.getComments
  );

  //Get Comment by ID
  /**
   * @swagger
   * /v1/comments/get-single-comments/{id}:
   *   get:
   *     summary: Get a comment by ID
   *     description: |
   *       This endpoint retrieves a single comment by its unique ID.
   *
   *       ## 🔐 **Authentication Required:**
   *       - API Key (Header: `x-api-key`)
   *
   *       ## 📝 **Usage Guide:**
   *       - Provide the `comment ID` as a path parameter.
   *       - The system will return the comment details and the author's information.
   *       - Make sure the comment ID is a valid number.
   *
   *     tags:
   *       - Comments
   *     security:
   *       - ApiKeyAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *           example: 101
   *         description: The unique ID of the comment to fetch.
   *     responses:
   *       200:
   *         description: Comment fetched successfully
   *         content:
   *           application/json:
   *             example:
   *               code: 200
   *               data:
   *                 id: 101
   *                 content: "This is a sample comment"
   *                 post_id: 5
   *                 author_id: 2
   *                 created_at: "2025-07-19T12:00:00.000Z"
   *                 User:
   *                   id: 2
   *                   username: "john_doe"
   *                   email: "john@example.com"
   *       400:
   *         description: Invalid comment ID
   *         content:
   *           application/json:
   *             example:
   *               code: 400
   *               message: "Comment ID must be a valid number"
   *       404:
   *         description: Comment not found
   *         content:
   *           application/json:
   *             example:
   *               code: 404
   *               message: "Comment not found"
   *       500:
   *         description: Internal server error
   *         content:
   *           application/json:
   *             example:
   *               code: 500
   *               message: "Something went wrong"
   */

  app.get(
    "/v1/comments/get-single-comments/:id",
    apiKeyMiddleware,
    commentController.getCommentById
  );

  //Update Comment
  /**
   * @swagger
   * /v1/comments/update-comments/{id}:
   *   post:
   *     summary: Update an existing comment
   *     description: |
   *       This endpoint allows an authenticated user to update one of their existing comments.
   *
   *       ## 🔐 **Authentication Required:**
   *       - API Key (Header: `x-api-key`)
   *       - JWT Token (Header: `Authorization: Bearer <token>`)
   *
   *       ## 📝 **Usage Guide:**
   *       - You must be logged in (JWT token required).
   *       - Only the comment's original author can update it.
   *       - `id` (comment ID) must be passed in the path parameter.
   *       - Request body should include the new `comment` text.
   *       - The system ensures the comment belongs to the authenticated user.
   *
   *     tags:
   *       - Comments
   *     security:
   *       - ApiKeyAuth: []
   *       - JWTAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *           example: 101
   *         description: The ID of the comment to update.
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - comment
   *             properties:
   *               comment:
   *                 type: string
   *                 description: The updated content of the comment.
   *                 example: "Updated comment text"
   *     responses:
   *       200:
   *         description: Comment updated successfully
   *         content:
   *           application/json:
   *             example:
   *               code: 200
   *               message: "Comment updated successfully"
   *       400:
   *         description: Validation error or invalid ID
   *         content:
   *           application/json:
   *             examples:
   *               invalidComment:
   *                 summary: Comment is empty
   *                 value:
   *                   code: 400
   *                   message: "\"comment\" is not allowed to be empty"
   *               invalidId:
   *                 summary: Invalid comment ID
   *                 value:
   *                   code: 400
   *                   message: "Comment ID must be a valid number"
   *       401:
   *         description: Unauthorized - missing or invalid JWT
   *         content:
   *           application/json:
   *             example:
   *               code: 401
   *               message: "Unauthorized user access"
   *       404:
   *         description: Comment not found or does not belong to the user
   *         content:
   *           application/json:
   *             example:
   *               code: 404
   *               message: "Comment not found or unauthorized"
   *       500:
   *         description: Server error
   *         content:
   *           application/json:
   *             example:
   *               code: 500
   *               message: "Something went wrong"
   */

  app.post(
    "/v1/comments/update-comments/:id",
    apiKeyMiddleware,
    jwtAuthMiddleware,
    commentController.updateComment
  );

  //Delete Comment
  /**
   * @swagger
   * /v1/comments/delete-comments/{id}:
   *   post:
   *     summary: Delete an existing comment
   *     description: |
   *       This endpoint allows an authenticated user to delete their own comment.
   *
   *       ## 🔐 **Authentication Required:**
   *       - API Key (Header: `x-api-key`)
   *       - JWT Token (Header: `Authorization: Bearer <token>`)
   *
   *       ## 📝 **Usage Guide:**
   *       - Only the comment's author can delete it.
   *       - Provide the `comment ID` as a path parameter.
   *       - Ensure you're authenticated with a valid JWT and API key.
   *       - The system checks that the comment exists and belongs to the user.
   *       - The comment will be permanently deleted from the database.
   *
   *     tags:
   *       - Comments
   *     security:
   *       - ApiKeyAuth: []
   *       - JWTAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *           example: 105
   *         description: The ID of the comment to delete.
   *     responses:
   *       200:
   *         description: Comment deleted successfully
   *         content:
   *           application/json:
   *             example:
   *               code: 200
   *               message: Comment deleted successfully
   *       400:
   *         description: Validation error - invalid comment ID
   *         content:
   *           application/json:
   *             example:
   *               code: 400
   *               message: Comment ID must be a valid number
   *       401:
   *         description: Unauthorized - missing or invalid JWT
   *         content:
   *           application/json:
   *             example:
   *               code: 401
   *               message: Unauthorized user access
   *       404:
   *         description: Comment not found or does not belong to the user
   *         content:
   *           application/json:
   *             example:
   *               code: 404
   *               message: Comment not found or unauthorized
   *       500:
   *         description: Internal server error
   *         content:
   *           application/json:
   *             example:
   *               code: 500
   *               message: Something went wrong
   */

  app.post(
    "/v1/comments/delete-comments/:id",
    apiKeyMiddleware,
    jwtAuthMiddleware,
    commentController.deleteComment
  );
};

module.exports = customRoutes;
