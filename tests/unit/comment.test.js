const request = require("supertest");
const app = require("../../app");
const db = require("../../models");

const API_KEY = "MyBlogAPIProject";

/* ─────────────────────  CREATE-COMMENT  ───────────────────── */
describe("POST /v1/comments/create-comments", () => {
  const ts = Date.now().toString() + Math.floor(Math.random() * 10000);
  const email = `commenter_${ts}@mail.com`;
  const password = "Comment123";
  let token = "";
  let postId = 0;

  beforeAll(async () => {
    // Register user
    await request(app)
      .post("/v1/user/register")
      .set("x-api-key", API_KEY)
      .send({
        fullname: "Comment User",
        username: `commenter_${ts}`,
        email,
        password,
        country_code: "+91",
        phone: `${ts.toString().slice(5)}`,
      });

    // Login user
    const loginRes = await request(app)
      .post("/v1/user/login")
      .set("x-api-key", API_KEY)
      .send({
        login_email_phone: email,
        password,
      });

    token = loginRes.body.data.user.token;

    const category = await db.Category.create({
      name: `Test Catgeory`,
    });

    // Create a post to comment on
    const postRes = await request(app)
      .post("/v1/posts/create-posts")
      .set("x-api-key", API_KEY)
      .set("Authorization", token)
      .send({
        title: "Post for Comment",
        content: "This post will be commented on",
        image_url: "https://example.com/comment.png",
        category_id: category.id,
      });

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

  it("should fail when post_id is invalid", async () => {
    const res = await request(app)
      .post("/v1/comments/create-comments")
      .set("x-api-key", API_KEY)
      .set("Authorization", token)
      .send({
        comment: "Invalid post test",
        post_id: 9999999, // non-existing post
      });

    expect(res.statusCode).toBe(404);
    expect(res.body).toHaveProperty("message", "Post not found");
  });

  it("should return 401 when token is missing", async () => {
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
});

/* ─────────────────────  GET-ALL-POST-COMMENT  ───────────────────── */
describe("GET /v1/comments/get-post-comments", () => {
  const ts = Date.now().toString() + Math.floor(Math.random() * 10000);
  const email = `comment_get_${ts}@mail.com`;
  const password = "GetComment123";
  let token = "";
  let postId = 0;

  beforeAll(async () => {
    // Register and login a user
    await request(app)
      .post("/v1/user/register")
      .set("x-api-key", API_KEY)
      .send({
        fullname: "Get Comment User",
        username: `getcomment_${ts}`,
        email,
        password,
        country_code: "+91",
        phone: `${ts.toString().slice(5)}`,
      });

    const loginRes = await request(app)
      .post("/v1/user/login")
      .set("x-api-key", API_KEY)
      .send({
        login_email_phone: email,
        password,
      });

    token = loginRes.body.data.user.token;

    // Create a post to comment on
    const postRes = await request(app)
      .post("/v1/posts/create-posts")
      .set("x-api-key", API_KEY)
      .set("Authorization", token)
      .send({
        title: "Post for Getting Comments",
        content: "Test post content",
        image_url: "https://example.com/img.png",
        category_id: 1,
      });

    postId = postRes.body.data.id;

    // Add 2 comments
    await request(app)
      .post("/v1/comments/create-comments")
      .set("x-api-key", API_KEY)
      .set("Authorization", token)
      .send({ comment: "Comment one", post_id: postId });

    await request(app)
      .post("/v1/comments/create-comments")
      .set("x-api-key", API_KEY)
      .set("Authorization", token)
      .send({ comment: "Comment two", post_id: postId });
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
    // Create a new post without comments
    const postRes = await request(app)
      .post("/v1/posts/create-posts")
      .set("x-api-key", API_KEY)
      .set("Authorization", token)
      .send({
        title: "Empty Comment Post",
        content: "No comments here",
        image_url: "https://example.com/empty.png",
        category_id: 1,
      });

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
});

/* ─────────────────────  GET-COMMENT-BY-ID  ───────────────────── */
describe("GET /v1/comments/get-single-comments/:id", () => {
  const ts = Date.now().toString() + Math.floor(Math.random() * 10000);
  const email = `single_c_${ts}@mail.com`;
  const password = "Comm123!";
  let token = "";
  let postId, commentId;

  /* ---------- Setup: user → post → comment ---------- */
  beforeAll(async () => {
    //  Register & login
    await request(app)
      .post("/v1/user/register")
      .set("x-api-key", API_KEY)
      .send({
        fullname: "Single‑Comment User",
        username: `scuser_${ts}`,
        email,
        password,
        country_code: "+91",
        phone: `${ts.toString().slice(5)}`,
      });

    const loginRes = await request(app)
      .post("/v1/user/login")
      .set("x-api-key", API_KEY)
      .send({
        login_email_phone: email,
        password,
      });

    token = loginRes.body.data.user.token;

    //  Create a post
    const postRes = await request(app)
      .post("/v1/posts/create-posts")
      .set("x-api-key", API_KEY)
      .set("Authorization", token)
      .send({
        title: "Post for single‑comment test",
        content: "content…",
        category_id: 1,
      });

    postId = postRes.body.data.id;

    //  Add a comment
    const commentRes = await request(app)
      .post("/v1/comments/create-comments")
      .set("x-api-key", API_KEY)
      .set("Authorization", token)
      .send({ comment: "Test comment", post_id: postId });

    commentId = commentRes.body.data.id;
  });

  /* ---------- Tests ---------- */

  it("should return the comment for a valid ID", async () => {
    const res = await request(app)
      .get(`/v1/comments/get-single-comments/${commentId}`)
      .set("x-api-key", API_KEY);

    expect(res.statusCode).toBe(200);
    expect(res.body.data).toHaveProperty("id", commentId);
    expect(res.body.data).toHaveProperty("comment", "Test comment");
  });

  it("should return 400 for non‑numeric ID", async () => {
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

  it("should return 401 when API‑key is missing", async () => {
    const res = await request(app).get(
      `/v1/comments/get-single-comments/${commentId}`
    );

    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty("message", "Invalid API key");
  });
});

/* ─────────────────────  UPDATE-COMMENT  ───────────────────── */
describe("POST /v1/comments/update-comments/:id", () => {
  let token = "";
  let commentId;
  let postId;
  const timestamp = Date.now().toString() + Math.floor(Math.random() * 10000);

  beforeAll(async () => {
    // Create user
    const email = `update_comment_${timestamp}@mail.com`;
    const password = "TestPass123";

    await request(app)
      .post("/v1/user/register")
      .set("x-api-key", API_KEY)
      .send({
        fullname: "Comment Editor",
        username: `comment_editor_${timestamp}`,
        email,
        password,
        country_code: "+91",
        phone: `9${timestamp.toString().slice(5)}`,
      });

    const loginRes = await request(app)
      .post("/v1/user/login")
      .set("x-api-key", API_KEY)
      .send({ login_email_phone: email, password });

    token = loginRes.body.data.user.token;

    // Create post
    const category = await db.Category.create({
      name: `updateCat_${timestamp}`,
    });

    const postRes = await request(app)
      .post("/v1/posts/create-posts")
      .set("x-api-key", API_KEY)
      .set("Authorization", token)
      .send({
        title: "Comment Update Post",
        content: "Test content",
        category_id: category.id,
        image_url: "https://image.url",
      });

    postId = postRes.body.data.id;

    // Create comment
    const commentRes = await request(app)
      .post("/v1/comments/create-comments")
      .set("x-api-key", API_KEY)
      .set("Authorization", token)
      .send({
        post_id: postId,
        comment: "Original Comment",
      });

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

  it("should return 404 if user tries to update another user's comment", async () => {
    // Create another user
    const email = `other_user_${timestamp}@mail.com`;
    await request(app)
      .post("/v1/user/register")
      .set("x-api-key", API_KEY)
      .send({
        fullname: "Other User",
        username: `other_user_${timestamp}`,
        email,
        password: "AnotherPass123",
        country_code: "+91",
        phone: `8${timestamp.toString().slice(5)}`,
      });

    const loginRes = await request(app)
      .post("/v1/user/login")
      .set("x-api-key", API_KEY)
      .send({ login_email_phone: email, password: "AnotherPass123" });

    const otherToken = loginRes.body.data.user.token;

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
});

/* ─────────────────────  DELETE-COMMENT  ───────────────────── */
describe("POST /v1/comments/delete-comments/:id", () => {
  let token = "";
  let commentId;
  let postId;
  const timestamp = Date.now().toString() + Math.floor(Math.random() * 10000);

  beforeAll(async () => {
    // Register user
    const email = `del_comment_${timestamp}@mail.com`;
    const password = "DeletePass123";

    await request(app)
      .post("/v1/user/register")
      .set("x-api-key", API_KEY)
      .send({
        fullname: "Delete Tester",
        username: `del_user_${timestamp}`,
        email,
        password,
        country_code: "+91",
        phone: `9${timestamp.toString().slice(5)}`,
      });

    const loginRes = await request(app)
      .post("/v1/user/login")
      .set("x-api-key", API_KEY)
      .send({ login_email_phone: email, password });

    token = loginRes.body.data.user.token;

    // Create category
    const category = await db.Category.create({ name: `delCat_${timestamp}` });

    // Create post
    const postRes = await request(app)
      .post("/v1/posts/create-posts")
      .set("x-api-key", API_KEY)
      .set("Authorization", token)
      .send({
        title: "Comment Delete Post",
        content: "Test delete comment content",
        category_id: category.id,
        image_url: "https://image.delete",
      });

    postId = postRes.body.data.id;

    // Create comment
    const commentRes = await request(app)
      .post("/v1/comments/create-comments")
      .set("x-api-key", API_KEY)
      .set("Authorization", token)
      .send({
        post_id: postId,
        comment: "Comment to be deleted",
      });

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
    // Register second user
    const email = `other_del_${timestamp}@mail.com`;
    const password = "OtherDelete123";

    await request(app)
      .post("/v1/user/register")
      .set("x-api-key", API_KEY)
      .send({
        fullname: "Other Deleter",
        username: `other_del_user_${timestamp}`,
        email,
        password,
        country_code: "+91",
        phone: `8${timestamp.toString().slice(5)}`,
      });

    const loginRes = await request(app)
      .post("/v1/user/login")
      .set("x-api-key", API_KEY)
      .send({ login_email_phone: email, password });

    const otherToken = loginRes.body.data.user.token;

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

/* ───────────────────  GLOBAL TEARDOWN  ──────────────────── */
afterAll(async () => {
  await db.sequelize.close(); // so Jest exits cleanly
});
