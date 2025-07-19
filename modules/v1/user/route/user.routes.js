const userController = require("../controller/user.controller");
const {
  apiKeyMiddleware,
  jwtAuthMiddleware,
} = require("../../../../middleware/auth.middleware");

// custom User route function : V1
const customRoutes = (app) => {
  // Test API
  app.get("/v1/user/test-api", apiKeyMiddleware, userController.sampleAPI);

  //User Registeration
  /**
   * @swagger
   * /v1/user/register:
   *   post:
   *     summary: Register a new user
   *     description: |
   *       ### 📘 User Guide:
   *       This endpoint supports two Registeration flows:
   *
   *       #### 🔐 Normal Registeration
   *       - Use  **email/password** for Normal Registeration
   *
   *       #### 🔐 Social Registeration
   *       - Use **social login (social_id)** for Social Registeration
   *
   *       ### 🔐 Authentication
   *       - This endpoint does not require JWT.
   *       - Requires API Key in `x-api-key` header
   *       - Does not require JWT for access
   *
   *       ### ✅ Sample Headers
   *       ```json
   *       {
   *         "x-api-key": "MyBlogAPIProject"
   *       }
   *       ```
   *     tags:
   *       - User
   *     security:
   *       - ApiKeyAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - fullname
   *               - username
   *               - email
   *             properties:
   *               fullname:
   *                 type: string
   *                 example: John Doe
   *               username:
   *                 type: string
   *                 example: johndoe
   *               email:
   *                 type: string
   *                 format: email
   *                 example: john@example.com
   *               password:
   *                 type: string
   *                 format: password
   *                 example: MyPassword123
   *               country_code:
   *                 type: string
   *                 example: "+91"
   *               phone:
   *                 type: string
   *                 example: "9876543210"
   *               profile_pic:
   *                 type: string
   *                 format: uri
   *                 example: "https://example.com/image.jpg"
   *               social_id:
   *                 type: string
   *                 example: "google-uid-123"
   *     responses:
   *       201:
   *         description: Signup successful
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
   *                   example: Signup successful
   *                 data:
   *                   type: object
   *                   properties:
   *                     id:
   *                       type: integer
   *                       example: 1
   *                     email:
   *                       type: string
   *                       example: john@example.com
   *                     username:
   *                       type: string
   *                       example: johndoe
   *       400:
   *         description: Validation failed
   *       409:
   *         description: Email, phone, or username already exists
   *       401:
   *         description: Invalid or missing API key
   *       500:
   *         description: Internal server error
   */
  app.post("/v1/user/register", apiKeyMiddleware, userController.user_signup);

  //User Login
  /**
   * @swagger
   * /v1/user/login:
   *   post:
   *     summary: User login
   *     description: |
   *       ### 📘 User Guide
   *       This endpoint supports two login flows:
   *
   *       #### 🔐 Normal Login
   *       - Use `login_email_phone` as either email or phone
   *       - Provide a `password`
   *
   *       #### 🔐 Social Login
   *       - Use `login_email_phone` as email
   *       - Provide a `social_id`
   *       - No password required
   *
   *       ### 🛡️ Security
   *       - Requires API Key in `x-api-key` header
   *       - Does not require JWT for access
   *
   *       ### ✅ Sample Headers
   *       ```json
   *       {
   *         "x-api-key": "MyBlogAPIProject"
   *       }
   *       ```
   *
   *     tags:
   *       - User
   *     security:
   *       - ApiKeyAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - login_email_phone
   *             properties:
   *               login_email_phone:
   *                 type: string
   *                 example: john@example.com
   *               password:
   *                 type: string
   *                 example: MyPassword123
   *               social_id:
   *                 type: string
   *                 example: google-uid-123
   *     responses:
   *       200:
   *         description: Login successful
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
   *                   example: Login successful
   *                 data:
   *                   type: object
   *                   properties:
   *                     user:
   *                       type: object
   *                       properties:
   *                         id:
   *                           type: integer
   *                           example: 1
   *                         email:
   *                           type: string
   *                           example: john@example.com
   *                         username:
   *                           type: string
   *                           example: johndoe
   *                         token:
   *                           type: string
   *                           example: eyJhbGciOiJIUzI1NiIsInR5cCI6...
   *       400:
   *         description: Validation failed
   *       401:
   *         description: Invalid credentials or missing/invalid API key
   *       403:
   *         description: Unauthorized access (inactive or unverified user)
   *       404:
   *         description: User account not found
   *       500:
   *         description: Internal server error
   */
  app.post("/v1/user/login", apiKeyMiddleware, userController.user_login);

  //User Logout
  /**
 * @swagger
 * /v1/user/logout:
 *   post:
 *     tags:
 *       - User
 *     summary: Logout User
 *     description: |
 *       🔒 **Logs out an authenticated user by updating their login status (`is_login = 0`).**

 *       
 *       ---
 *       ## ✅ **Headers Required:**
 *       
 *       - 🔑 `x-api-key`: Your assigned API key  
 *       - 🛡️ `Authorization`: Bearer token (JWT returned from login)
 *       
 *       ---
 *       ## ❗ **Important Notes:**
 *       
 *       - 🚫 This endpoint only works for **authenticated** users.  
 *       - ⛔ If the JWT token is missing or invalid, the request will be rejected.
 *       - 🔄 No request body is needed for this endpoint.
 *
 *     operationId: userLogout
 *     security:
 *       - ApiKeyAuth: []        
 *       - JWTAuth: []       
 *     requestBody:
 *       required: false
 *       description: No request body required
 *     responses:
 *       200:
 *         description: Logout successful
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
 *                   example: Logout successful
 *       401:
 *         description: Unauthorized (missing or invalid token)
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */

  app.post(
    "/v1/user/logout",
    apiKeyMiddleware,
    jwtAuthMiddleware,
    userController.user_logout
  );

  //User Forgot Password
  /**
   * @swagger
   * /v1/user/forgot-password:
   *   post:
   *     tags:
   *       - User
   *     summary: Change user password
   *     description: |
   *       ### 🧰 Forgot Password API - User Guide
   *
   *       This endpoint allows an authenticated user (with **normal login type only**) to change their password securely.
   *
   *       #### 🔐 Required Headers:
   *       - `x-api-key`: **MyBlogAPIProject**
   *       - `Authorization`: **YOUR_JWT_TOKEN**
   *
   *       > ⚠️ Both headers are mandatory for this API.
   *
   *       #### ℹ️ Notes:
   *       - Only works for users with `login_type: "normal"`
   *       - Social login users cannot change password using this endpoint
   *       - User must be valid (active, verified, and not deleted)
   *
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
   *               - old_password
   *               - new_password
   *             properties:
   *               old_password:
   *                 type: string
   *                 example: OldPass123
   *               new_password:
   *                 type: string
   *                 example: NewPass456
   *     responses:
   *       200:
   *         description: Password changed successfully
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
   *                   example: Password changed successfully
   *       400:
   *         description: Validation error or missing fields
   *       401:
   *         description: Unauthorized user or invalid old password
   *       404:
   *         description: User not found or not eligible
   *       500:
   *         description: Internal server error
   */
  app.post(
    "/v1/user/forgot-password",
    apiKeyMiddleware,
    jwtAuthMiddleware,
    userController.user_forgot_password
  );

  //User Reset Password
  /**
   * @swagger
   * /v1/user/reset-password:
   *   post:
   *     tags:
   *       - User
   *     summary: Reset user password
   *     description: |
   *       🔒 **Allows an authenticated and logged-in user (with "normal" login type) to reset their password.**
   *
   *       This endpoint is used when the user knows their identity and just wants to reset the password without verifying the old one.
   *
   *       ### ✅ **Headers Required:**
   *
   *       - 🔑 `x-api-key`: Your assigned API key
   *       - 🛡️ `Authorization`: token (JWT returned from login)
   *
   *       ### ❗**Important Notes:**
   *
   *       - 🚫 This endpoint is **not for "forgot password"** flow — it's only for logged-in users.
   *       - ⛔ Users who signed up via social login (`login_type !== "normal"`) are **not allowed** to use this endpoint.
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
   *               - new_password
   *             properties:
   *               new_password:
   *                 type: string
   *                 example: NewSecurePass123
   *     responses:
   *       200:
   *         description: Password reset successful
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
   *                   example: Password reset successful
   *       400:
   *         description: Validation failed or missing fields
   *       401:
   *         description: Unauthorized or user not logged in
   *       403:
   *         description: Operation not allowed for social login users
   *       404:
   *         description: User not found
   *       500:
   *         description: Internal server error
   */

  app.post(
    "/v1/user/reset-password",
    apiKeyMiddleware,
    jwtAuthMiddleware,
    userController.user_reset_password
  );

  //User Edit Profile
  /**
   * @swagger
   * /v1/user/edit-profile:
   *   post:
   *     tags:
   *       - User
   *     summary: Edit user profile
   *     description: |
   *       This endpoint allows a logged-in user to update their profile details including email, username, fullname, phone, etc.
   *       ⚠️ Email, phone, and username must be unique.
   *
   *       ## 🔐 **Authentication Required:**
   *       - API Key in headers
   *       - JWT Token in Authorization header
   *
   *       ## 🛡️ **User Guide:**
   *       1. **Headers Required**:
   *          - `x-api-key`: Your API key (e.g., `"MyBlogAPIProject"`)
   *          - `Authorization`: Bearer token received after login
   *
   *       2. **Request Body (JSON)**:
   *          - You can send one or multiple fields to update
   *          - The email, username, and phone fields will be checked for uniqueness
   *
   *       3. **Example Header Setup (Postman or Swagger "Authorize")**:
   *          ```
   *          x-api-key: MyBlogAPIProject
   *          Authorization: <your_token_here>
   *          ```
   *
   *       ## 📌 Note: Only authenticated and logged-in users can access this endpoint.
   *     security:
   *       - ApiKeyAuth: []
   *       - JWTAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               fullname:
   *                 type: string
   *                 example: "John Doe"
   *               username:
   *                 type: string
   *                 example: "john_doe"
   *               email:
   *                 type: string
   *                 example: "john@example.com"
   *               country_code:
   *                 type: string
   *                 example: "+91"
   *               phone:
   *                 type: string
   *                 example: "9876543210"
   *               profile_pic:
   *                 type: string
   *                 example: "https://example.com/profile.jpg"
   *     responses:
   *       200:
   *         description: Profile updated successfully
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
   *                   example: Profile updated successfully
   *                 data:
   *                   type: object
   *                   properties:
   *                     id:
   *                       type: integer
   *                       example: 101
   *                     email:
   *                       type: string
   *                       example: john@example.com
   *                     username:
   *                       type: string
   *                       example: john_doe
   *       400:
   *         description: Validation failed or missing fields
   *       401:
   *         description: Unauthorized access or not logged in
   *       403:
   *         description: Forbidden operation
   *       404:
   *         description: User not found
   *       409:
   *         description: Duplicate email, username, or phone
   *       500:
   *         description: Internal server error
   */

  app.post(
    "/v1/user/edit-profile",
    apiKeyMiddleware,
    jwtAuthMiddleware,
    userController.user_edit_profile
  );
};

module.exports = customRoutes;
