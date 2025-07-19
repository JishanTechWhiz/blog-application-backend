const request = require("supertest");
const app = require("../../app");
const db = require("../../models");

const API_KEY = "MyBlogAPIProject";

const {
  registerUser,
  createCategory,
  createPost,
  createComment,
} = require("../testUtils");

/* ─────────────────────  CREATE COMMENT TEST  ───────────────────── */
describe("POST /v1/comments/create-comments", () => {
  let token = "";
  let postId = 0;

  beforeAll(async () => {
    // Create user & login
    const user = await registerUser();
    token = user.token;

    // Create category
    const category = await createCategory();

    // Create post using helper
    const postRes = await createPost(token, category.id);
    postId = postRes.body.data.id;
  });

  it("should create a comment successfully", async () => {
    const res = await request(app)
      .post("/v1/comments/create-comments")
      .set("x-api-key", API_KEY)
      .set("Authorization", token)
      .send({
        comment: "Nice post!",
        post_id: postId,
      });

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty("message", "Comment created successfully");
    expect(res.body.data).toHaveProperty("comment", "Nice post!");
    expect(res.body.data).toHaveProperty("post_id", postId);
  });

  it("should fail when comment text is missing", async () => {
    const res = await request(app)
      .post("/v1/comments/create-comments")
      .set("x-api-key", API_KEY)
      .set("Authorization", token)
      .send({
        post_id: postId,
      });

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty("message");
  });

  it("should fail with invalid post_id", async () => {
    const res = await request(app)
      .post("/v1/comments/create-comments")
      .set("x-api-key", API_KEY)
      .set("Authorization", token)
      .send({
        comment: "Invalid post test",
        post_id: 99999999,
      });

    expect(res.statusCode).toBe(404);
    expect(res.body).toHaveProperty("message", "Post not found");
  });

  it("should fail when token is missing", async () => {
    const res = await request(app)
      .post("/v1/comments/create-comments")
      .set("x-api-key", API_KEY)
      .send({
        comment: "Unauthorized comment",
        post_id: postId,
      });

    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty("message", "Authorization token missing");
  });

  it("should fail with invalid API key", async () => {
    const res = await request(app)
      .post("/v1/comments/create-comments")
      .set("x-api-key", "INVALID_KEY")
      .set("Authorization", token)
      .send({
        comment: "Bad API key test",
        post_id: postId,
      });

    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty("message", "Invalid API key");
  });
});

// /* ─────────────────────  GET-ALL-POST-COMMENT  ───────────────────── */
describe("GET /v1/comments/get-post-comments", () => {
  let token, postId;

  beforeAll(async () => {
    await db.sequelize.sync({ force: true });

    // Register user & get token
    const user = await registerUser();
    token = user.token;

    // Create category and post
    const category = await createCategory();
    const postRes = await createPost(token, category.id);
    postId = postRes.body.data.id;

    // Add 2 comments
    await createComment(token, postId);
    await createComment(token, postId);
  });

  it("should fetch all comments for a post", async () => {
    const res = await request(app)
      .get(`/v1/comments/get-post-comments?post_id=${postId}`)
      .set("x-api-key", API_KEY);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("data");
    expect(res.body.data.length).toBeGreaterThanOrEqual(2);
    expect(res.body.pagination).toHaveProperty("currentPage", 1);
  });

  it("should return 400 if post_id is missing", async () => {
    const res = await request(app)
      .get("/v1/comments/get-post-comments")
      .set("x-api-key", API_KEY);

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty(
      "message",
      "post_id is required and must be a valid number"
    );
  });

  it("should return 404 if post_id does not exist", async () => {
    const res = await request(app)
      .get("/v1/comments/get-post-comments?post_id=999999")
      .set("x-api-key", API_KEY);

    expect(res.statusCode).toBe(404);
    expect(res.body).toHaveProperty("message", "Post not found");
  });

  it("should return 404 if post has no comments", async () => {
    const category = await createCategory();
    const postRes = await createPost(token, category.id);
    const newPostId = postRes.body.data.id;

    const res = await request(app)
      .get(`/v1/comments/get-post-comments?post_id=${newPostId}`)
      .set("x-api-key", API_KEY);

    expect(res.statusCode).toBe(404);
    expect(res.body).toHaveProperty(
      "message",
      "No comments found for this post"
    );
  });

  it("should return 400 for out-of-range page", async () => {
    const res = await request(app)
      .get(`/v1/comments/get-post-comments?post_id=${postId}&page=999`)
      .set("x-api-key", API_KEY);

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty(
      "message",
      "Requested page is out of range"
    );
  });

  it("should return 401 for missing or invalid API key", async () => {
    const res = await request(app).get(
      `/v1/comments/get-post-comments?post_id=${postId}`
    );

    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty("message", "Invalid API key");
  });
});

// /* ─────────────────────  GET-COMMENT-BY-ID  ───────────────────── */
describe("GET /v1/comments/get-single-comments/:id", () => {
  let token, commentId;

  beforeAll(async () => {
    const { token: userToken } = await registerUser();
    token = userToken;

    const category = await createCategory();
    const postRes = await createPost(token, category.id);

    const postId = postRes.body.data.id;

    const commentRes = await createComment(token, postId);
    commentId = commentRes.body.data.id;
  });

  it("should return the comment for a valid ID", async () => {
    const res = await request(app)
      .get(`/v1/comments/get-single-comments/${commentId}`)
      .set("x-api-key", API_KEY);

    expect(res.statusCode).toBe(200);
    expect(res.body.data).toHaveProperty("id", commentId);
    expect(res.body.data).toHaveProperty("comment", "Test comment");
  });

  it("should return 400 for non-numeric ID", async () => {
    const res = await request(app)
      .get("/v1/comments/get-single-comments/abc")
      .set("x-api-key", API_KEY);

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty(
      "message",
      "Comment ID must be a valid number"
    );
  });

  it("should return 404 when comment does not exist", async () => {
    const res = await request(app)
      .get("/v1/comments/get-single-comments/9999999")
      .set("x-api-key", API_KEY);

    expect(res.statusCode).toBe(404);
    expect(res.body).toHaveProperty("message", "Comment not found");
  });

  it("should return 401 when API-key is missing", async () => {
    const res = await request(app).get(
      `/v1/comments/get-single-comments/${commentId}`
    );

    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty("message", "Invalid API key");
  });
});

// /* ─────────────────────  UPDATE-COMMENT  ───────────────────── */
describe("POST /v1/comments/update-comments/:id", () => {
  let token, commentId;

  beforeAll(async () => {
    const { token: userToken } = await registerUser();
    token = userToken;

    const category = await createCategory();
    const postRes = await createPost(token, category.id);
    const postId = postRes.body.data.id;

    const commentRes = await createComment(token, postId);
    commentId = commentRes.body.data.id;
  });

  it("should update comment successfully", async () => {
    const res = await request(app)
      .post(`/v1/comments/update-comments/${commentId}`)
      .set("x-api-key", API_KEY)
      .set("Authorization", token)
      .send({ comment: "Updated Comment" });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("message", "Comment updated successfully");
  });

  it("should return 400 for invalid comment ID", async () => {
    const res = await request(app)
      .post("/v1/comments/update-comments/abc")
      .set("x-api-key", API_KEY)
      .set("Authorization", token)
      .send({ comment: "Updated" });

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty(
      "message",
      "Comment ID must be a valid number"
    );
  });

  it("should return 400 for missing comment in body", async () => {
    const res = await request(app)
      .post(`/v1/comments/update-comments/${commentId}`)
      .set("x-api-key", API_KEY)
      .set("Authorization", token)
      .send({});

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty("message");
  });

  it("should return 401 if token is missing", async () => {
    const res = await request(app)
      .post(`/v1/comments/update-comments/${commentId}`)
      .set("x-api-key", API_KEY)
      .send({ comment: "No Token Update" });

    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty("message", "Authorization token missing");
  });

  it("should return 404 if another user tries to update the comment", async () => {
    const { token: otherToken } = await registerUser(Date.now() + 1000); // new user

    const res = await request(app)
      .post(`/v1/comments/update-comments/${commentId}`)
      .set("x-api-key", API_KEY)
      .set("Authorization", otherToken)
      .send({ comment: "Trying to update someone else's comment" });

    expect(res.statusCode).toBe(404);
    expect(res.body).toHaveProperty(
      "message",
      "Comment not found or unauthorized"
    );
  });

  it("should fail with invalid API key", async () => {
    const res = await request(app)
      .post(`/v1/comments/update-comments/${commentId}`)
      .set("x-api-key", "InvalidKey")
      .set("Authorization", token)
      .send({ comment: "Invalid key update" });

    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty("message", "Invalid API key");
  });
});

// /* ───────────────────── DELETE COMMENT ───────────────────── */
describe("POST /v1/comments/delete-comments/:id", () => {
  let token = "";
  let otherToken = "";
  let commentId;
  let postId;

  const timestamp = Date.now().toString() + Math.floor(Math.random() * 10000);

  beforeAll(async () => {
    // Clean DB
    await db.sequelize.sync({ force: true });

    // First user
    const user1 = await registerUser(timestamp);
    token = user1.token;

    // Second user
    const user2 = await registerUser(timestamp + "_2");
    otherToken = user2.token;

    // Create category & post
    const category = await createCategory(timestamp);
    const postRes = await createPost(token, category.id, timestamp);
    postId = postRes.body.data.id;

    // Create comment
    const commentRes = await createComment(token, postId);
    commentId = commentRes.body.data.id;
  });

  it("should delete comment successfully", async () => {
    const res = await request(app)
      .post(`/v1/comments/delete-comments/${commentId}`)
      .set("x-api-key", API_KEY)
      .set("Authorization", token);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("message", "Comment deleted successfully");
  });

  it("should return 400 for invalid comment ID", async () => {
    const res = await request(app)
      .post("/v1/comments/delete-comments/invalid")
      .set("x-api-key", API_KEY)
      .set("Authorization", token);

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty(
      "message",
      "Comment ID must be a valid number"
    );
  });

  it("should return 401 if token is missing", async () => {
    const res = await request(app)
      .post(`/v1/comments/delete-comments/${commentId}`)
      .set("x-api-key", API_KEY);

    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty("message", "Authorization token missing");
  });

  it("should return 404 for unauthorized user trying to delete comment", async () => {
    const res = await request(app)
      .post(`/v1/comments/delete-comments/${commentId}`)
      .set("x-api-key", API_KEY)
      .set("Authorization", otherToken);

    expect(res.statusCode).toBe(404);
    expect(res.body).toHaveProperty(
      "message",
      "Comment not found or unauthorized"
    );
  });
});


