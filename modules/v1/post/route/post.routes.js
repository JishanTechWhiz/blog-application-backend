const postController = require("../controller/post.controller");
const {
  apiKeyMiddleware,
  jwtAuthMiddleware,
} = require("../../../../middleware/auth.middleware");

// custom Post route function : V1
const customRoutes = (app) => {
  //Get All Posts
  /**
   * @swagger
   * /v1/posts/get-all-posts:
   *   get:
   *     tags:
   *       - Post
   *     summary: Get all blog posts
   *     description: |
   *       This endpoint retrieves all active (non-deleted) blog posts with pagination support.
   *       It includes basic information about the author of each post.
   *       <br><br>
   *       ## 🔐 **Security:**
   *       - Requires `x-api-key` header only
   *       - **JWT is not required** (publicly accessible endpoint with API key)
   *     security:
   *       - ApiKeyAuth: []
   *     parameters:
   *       - name: page
   *         in: query
   *         required: false
   *         description: Page number for pagination (default = 1)
   *         schema:
   *           type: integer
   *           example: 2
   *     responses:
   *       200:
   *         description: Successfully retrieved paginated posts
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 code:
   *                   type: integer
   *                   example: 200
   *                 data:
   *                   type: array
   *                   items:
   *                     type: object
   *                     properties:
   *                       id:
   *                         type: integer
   *                         example: 3
   *                       title:
   *                         type: string
   *                         example: Exploring Node.js
   *                       content:
   *                         type: string
   *                         example: This post discusses Node.js fundamentals...
   *                       image_url:
   *                         type: string
   *                         example: https://example.com/image.jpg
   *                       author:
   *                         type: object
   *                         properties:
   *                           id:
   *                             type: integer
   *                             example: 1
   *                           username:
   *                             type: string
   *                             example: johndoe
   *                           email:
   *                             type: string
   *                             example: johndoe@example.com
   *                 pagination:
   *                   type: object
   *                   properties:
   *                     currentPage:
   *                       type: integer
   *                       example: 1
   *                     totalPages:
   *                       type: integer
   *                       example: 5
   *                     totalPosts:
   *                       type: integer
   *                       example: 50
   *       400:
   *         description: Invalid page number
   *       500:
   *         description: Internal server error
   */

  app.get(
    "/v1/posts/get-all-posts",
    apiKeyMiddleware,
    postController.getAllPosts
  );

  //Get Post By ID
  /**
   * @swagger
   * /v1/posts/get-single-post/{id}:
   *   get:
   *     tags:
   *       - Post
   *     summary: Get a single blog post by ID
   *     description: |
   *       This endpoint allows users to retrieve the details of a specific blog post by its unique ID.
   *       The response includes the post's content, creation date, and author information.
   *       Only posts that are not soft-deleted (`is_deleted = 0`) are returned.
   *
   *       ## 🔐 **Authentication Required:**
   *       - API Key (Header: `x-api-key`)
   *
   *     parameters:
   *       - name: id
   *         in: path
   *         required: true
   *         schema:
   *           type: integer
   *           example: 101
   *         description: Unique identifier of the blog post to fetch.
   *     responses:
   *       200:
   *         description: Post retrieved successfully
   *         content:
   *           application/json:
   *             example:
   *               code: 200
   *               data:
   *                 id: 101
   *                 title: "Understanding JWT in Node.js"
   *                 content: "JSON Web Tokens (JWT) are a compact way to securely transmit information..."
   *                 image_url: "https://example.com/post-image.jpg"
   *                 author:
   *                   id: 21
   *                   username: "jishan_blog"
   *                   email: "jishan@example.com"
   *                 created_at: "2025-07-18T10:00:00.000Z"
   *                 updated_at: "2025-07-18T10:15:00.000Z"
   *       400:
   *         description: Invalid post ID format
   *       404:
   *         description: Post not found or deleted
   *       500:
   *         description: Server error
   */

  app.get(
    "/v1/posts/get-single-post/:id",
    apiKeyMiddleware,
    postController.getPostById
  );

  //Get All By Category Name
  /**
   * @swagger
   * /v1/posts/get-all-category-posts:
   *   get:
   *     summary: Get all blog posts by category name
   *     description: |
   *       This endpoint retrieves all blog posts that belong to a specific category.
   *       Results are paginated (6 posts per page by default), sorted by creation date in descending order.
   *
   *       ## 🔐 **Authentication Required:**
   *       - API Key (Header: `x-api-key`)
   *
   *       ## 📘 **Usage Guide:**
   *       - Provide the `category_name` as a query parameter.
   *       - Optional `page` query parameter is supported for pagination (default is `1`).
   *       - This endpoint returns the list of posts with category and author information.
   *       - Soft-deleted posts (`is_deleted = 1`) are automatically excluded.
   *
   *     tags:
   *       - Post
   *     parameters:
   *       - name: category_name
   *         in: query
   *         required: true
   *         schema:
   *           type: string
   *           example: Technology
   *         description: The name of the category to filter posts by.
   *       - name: page
   *         in: query
   *         required: false
   *         schema:
   *           type: integer
   *           example: 1
   *         description: The page number for pagination (6 posts per page).
   *
   *     responses:
   *       200:
   *         description: List of posts retrieved successfully
   *         content:
   *           application/json:
   *             example:
   *               code: 200
   *               data:
   *                 - id: 102
   *                   title: "Latest Tech Trends 2025"
   *                   content: "Technology is evolving at a rapid pace..."
   *                   image_url: "https://example.com/tech-post.jpg"
   *                   author:
   *                     id: 21
   *                     username: "jishan_blog"
   *                     email: "jishan@example.com"
   *                   category:
   *                     id: 1
   *                     name: "Technology"
   *                   created_at: "2025-07-19T12:00:00.000Z"
   *                   updated_at: "2025-07-19T12:15:00.000Z"
   *               pagination:
   *                 currentPage: 1
   *                 totalPages: 3
   *                 totalPosts: 18
   *
   *       400:
   *         description: Missing or invalid category name or page out of range
   *         content:
   *           application/json:
   *             examples:
   *               missingCategory:
   *                 summary: Missing category_name
   *                 value:
   *                   code: 400
   *                   message: "category_name is required"
   *               invalidPage:
   *                 summary: Page out of range
   *                 value:
   *                   code: 400
   *                   message: "Requested page is out of range"
   *
   *       404:
   *         description: No posts found in the given category
   *
   *       500:
   *         description: Server error
   */

  app.get(
    "/v1/posts/get-all-category-posts",
    apiKeyMiddleware,
    postController.getAllPostsByCategoryName
  );

  //Create Post
  /**
   * @swagger
   * /v1/posts/create-posts:
   *   post:
   *     tags:
   *       - Post
   *     summary: Create a new blog post
   *     description: |
   *       Allows an authenticated user to create a new blog post by providing the required details.
   *       <br><br>
   *       ## 🔐 **Security:**
   *       - Requires `x-api-key` header
   *       - Requires JWT token in `Authorization` header
   *       <br>
   *       ## 📝 **Validation:**
   *       - `title`, `content`, and `category_id` are required fields
   *       - `image_url` is optional
   *       - `category_id` must exist in the system
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
   *               - title
   *               - content
   *               - category_id
   *             properties:
   *               title:
   *                 type: string
   *                 example: "How to Learn Node.js"
   *               content:
   *                 type: string
   *                 example: "This is a complete beginner's guide to learning Node.js..."
   *               image_url:
   *                 type: string
   *                 example: "https://example.com/image.jpg"
   *               category_id:
   *                 type: integer
   *                 example: 1
   *     responses:
   *       201:
   *         description: Post created successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 code:
   *                   type: integer
   *                   example: 200
   *                 message:
   *                   type: string
   *                   example: Post created successfully
   *                 data:
   *                   type: object
   *                   properties:
   *                     id:
   *                       type: integer
   *                       example: 10
   *                     title:
   *                       type: string
   *                     content:
   *                       type: string
   *                     image_url:
   *                       type: string
   *                     category_id:
   *                       type: integer
   *                     author_id:
   *                       type: integer
   *       400:
   *         description: Validation error or invalid category ID
   *       401:
   *         description: Unauthorized (missing/invalid token)
   *       500:
   *         description: Internal server error
   */

  app.post(
    "/v1/posts/create-posts",
    apiKeyMiddleware,
    jwtAuthMiddleware,
    postController.createPost
  );

  //Update Post
  /**
   * @swagger
   * /v1/posts/update-posts/{id}:
   *   post:
   *     tags:
   *       - Post
   *     summary: Update an existing blog post
   *     description: |
   *       Allows an authenticated user to update one of their existing blog posts.
   *       <br><br>
   *       ## 🔐 **Security:**
   *       - Requires `x-api-key` header
   *       - Requires Bearer JWT token in `Authorization` header
   *       <br>
   *       ## 📝 **Validation:**
   *       - You must provide at least one updatable field (title, content, image_url, category_id)
   *       - Only the original author of the post can update it
   *       - The post must not be deleted (`is_deleted: 0`)
   *     security:
   *       - ApiKeyAuth: []
   *       - JWTAuth: []
   *     parameters:
   *       - name: id
   *         in: path
   *         required: true
   *         description: ID of the post to update
   *         schema:
   *           type: integer
   *           example: 5
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               title:
   *                 type: string
   *                 example: "Updated Post Title"
   *               content:
   *                 type: string
   *                 example: "Updated blog content..."
   *               image_url:
   *                 type: string
   *                 example: "https://example.com/updated-image.jpg"
   *               category_id:
   *                 type: integer
   *                 example: 2
   *     responses:
   *       200:
   *         description: Post updated successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 code:
   *                   type: integer
   *                   example: 200
   *                 message:
   *                   type: string
   *                   example: Post updated successfully
   *                 data:
   *                   type: object
   *       400:
   *         description: Validation error
   *       401:
   *         description: Unauthorized (missing/invalid token)
   *       404:
   *         description: Post not found or unauthorized
   *       500:
   *         description: Internal server error
   */

  app.post(
    "/v1/posts/update-posts/:id",
    apiKeyMiddleware,
    jwtAuthMiddleware,
    postController.updatePost
  );

  //Soft Delete Post
  /**
   * @swagger
   * /v1/posts/soft-delete-posts/{id}:
   *   post:
   *     tags:
   *       - Post
   *     summary: Soft delete a blog post
   *     description: |
   *       Soft deletes a post by marking it as `is_deleted: 1` instead of removing it from the database.
   *       <br><br>
   *       ## 🔐 **Security:**
   *       - Requires `x-api-key` header
   *       - Requires Bearer JWT token in `Authorization` header
   *       <br>
   *       ## 🛡️ **Authorization:**
   *       - Only the original author of the post can soft delete it
   *       - The post must not already be deleted
   *     security:
   *       - ApiKeyAuth: []
   *       - JWTAuth: []
   *     parameters:
   *       - name: id
   *         in: path
   *         required: true
   *         description: ID of the post to soft delete
   *         schema:
   *           type: integer
   *           example: 3
   *     responses:
   *       200:
   *         description: Post soft-deleted successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 code:
   *                   type: integer
   *                   example: 200
   *                 message:
   *                   type: string
   *                   example: Post deleted successfully
   *                 data:
   *                   type: object
   *                   properties:
   *                     id:
   *                       type: integer
   *                       example: 3
   *                     title:
   *                       type: string
   *                       example: My Deleted Blog Post
   *                     deletedAt:
   *                       type: string
   *                       format: date-time
   *                       example: 2025-07-19T12:34:56.789Z
   *       401:
   *         description: Unauthorized - Missing or invalid JWT
   *       404:
   *         description: Post not found or not owned by user
   *       500:
   *         description: Internal server error
   */

  app.post(
    "/v1/posts/soft-delete-posts/:id",
    apiKeyMiddleware,
    jwtAuthMiddleware,
    postController.softDeletePost
  );

  //Hard Delete Post
  /**
   * @swagger
   * /v1/posts/hard-delete-posts/{id}:
   *   post:
   *     tags:
   *       - Post
   *     summary: Permanently delete a blog post
   *     description: |
   *       This endpoint permanently deletes a post from the database (hard delete).
   *       <br><br>
   *       ## 🔐 **Security:**
   *       - Requires `x-api-key` header
   *       - Requires Bearer JWT token in `Authorization` header
   *       <br>
   *       ## 🛡️ **Authorization:**
   *       - Only the original author of the post can perform hard delete
   *       - Soft-deleted posts can also be hard-deleted
   *     security:
   *       - ApiKeyAuth: []
   *       - JWTAuth: []
   *     parameters:
   *       - name: id
   *         in: path
   *         required: true
   *         description: ID of the post to permanently delete
   *         schema:
   *           type: integer
   *           example: 3
   *     responses:
   *       200:
   *         description: Post permanently deleted
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 code:
   *                   type: integer
   *                   example: 200
   *                 message:
   *                   type: string
   *                   example: Post permanently deleted
   *                 data:
   *                   type: object
   *                   properties:
   *                     id:
   *                       type: integer
   *                       example: 3
   *                     title:
   *                       type: string
   *                       example: My Deleted Blog Post
   *       401:
   *         description: Unauthorized - Missing or invalid JWT
   *       404:
   *         description: Post not found or not owned by user
   *       500:
   *         description: Internal server error
   */

  app.post(
    "/v1/posts/hard-delete-posts/:id",
    apiKeyMiddleware,
    jwtAuthMiddleware,
    postController.hardDeletePost
  );
};

module.exports = customRoutes;
