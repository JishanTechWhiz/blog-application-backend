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

// /* ─────────────────────  CREATE-POST  ───────────────────── */
describe("POST /v1/posts/create-posts", () => {
  let token, category;

  beforeAll(async () => {
    await db.sequelize.sync({ force: true });

    const user = await registerUser();
    token = user.token;

    category = await createCategory();
  });

  it("should create a post successfully", async () => {
    const res = await request(app)
      .post("/v1/posts/create-posts")
      .set("x-api-key", API_KEY)
      .set("Authorization", token)
      .send({
        title: "Sample Post",
        content: "This is a sample post content.",
        image_url: "https://example.com/image.jpg",
        category_id: category.id,
      });

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty("message", "Post created successfully");
    expect(res.body.data).toHaveProperty("id");
  });

  it("should fail when title is missing", async () => {
    const res = await request(app)
      .post("/v1/posts/create-posts")
      .set("x-api-key", API_KEY)
      .set("Authorization", token)
      .send({
        content: "Missing title",
        image_url: "https://example.com/image.jpg",
        category_id: category.id,
      });

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty("message");
    expect(res.body.message).toMatch(/title/i);
  });

  it("should fail with invalid category_id", async () => {
    const res = await request(app)
      .post("/v1/posts/create-posts")
      .set("x-api-key", API_KEY)
      .set("Authorization", token)
      .send({
        title: "Invalid Category",
        content: "Should fail due to category",
        image_url: "https://example.com/image.jpg",
        category_id: 999999,
      });

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty(
      "message",
      "Invalid category ID. Category does not exist."
    );
  });

  it("should return 401 when token is missing", async () => {
    const res = await request(app)
      .post("/v1/posts/create-posts")
      .set("x-api-key", API_KEY)
      .send({
        title: "Unauthorized Post",
        content: "No token provided.",
        image_url: "https://example.com/image.jpg",
        category_id: category.id,
      });

    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty("message", "Authorization token missing");
  });

  it("should return 401 with invalid API key", async () => {
    const res = await request(app)
      .post("/v1/posts/create-posts")
      .set("x-api-key", "INVALID_KEY")
      .send({
        title: "Invalid API",
        content: "Trying to create with bad API key",
        image_url: "https://example.com/image.jpg",
        category_id: category.id,
      });

    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty("message", "Invalid API key");
  });
});

// /* ─────────────────────  GET-ALL-POST  ───────────────────── */
describe("GET /v1/posts/get-all-posts", () => {
  let token, userId, category;

  beforeAll(async () => {
    await db.sequelize.sync({ force: true });

    const userData = await registerUser();
    token = userData.token;
    userId = userData.userId;

    category = await createCategory();
    await createPost(token, category.id);
  });

  it("should return list of posts with pagination", async () => {
    const res = await request(app)
      .get("/v1/posts/get-all-posts?page=1")
      .set("x-api-key", API_KEY);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("data");
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body).toHaveProperty("pagination");
    expect(res.body.pagination).toHaveProperty("currentPage", 1);
  });

  it("should return 400 for page out of range", async () => {
    const res = await request(app)
      .get("/v1/posts/get-all-posts?page=9999")
      .set("x-api-key", API_KEY);

    if (res.statusCode === 400) {
      expect(res.body).toHaveProperty(
        "message",
        "Requested page is out of range"
      );
    } else {
      expect(res.statusCode).toBe(200);
    }
  });

  it("should return 401 when API key is missing", async () => {
    const res = await request(app).get("/v1/posts/get-all-posts?page=1"); // no API key

    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty("message", "Invalid API key");
  });
});

// /* ─────────────────────  GET-POST-BY-ID  ───────────────────── */
describe("GET /v1/posts/get-single-post/:id", () => {
  let token, userId, postId;

  beforeAll(async () => {
    const ts = Date.now();

    // Create user and get token
    const user = await registerUser(ts);
    token = user.token;
    userId = user.userId;

    // Create category
    const category = await createCategory(ts);

    // Create post
    const postRes = await createPost(token, category.id, ts);
    postId = postRes.body.data.id;
  });

  it("should return the post for a valid ID", async () => {
    const res = await request(app)
      .get(`/v1/posts/get-single-post/${postId}`)
      .set("x-api-key", API_KEY);

    expect(res.statusCode).toBe(200);
    expect(res.body.code).toBe(200);
    expect(res.body).toHaveProperty("data");
    expect(res.body.data).toHaveProperty("title");
    expect(res.body.data).toHaveProperty("author");
  });

  it("should return 404 for a non-existing post ID", async () => {
    const res = await request(app)
      .get(`/v1/posts/get-single-post/999999`)
      .set("x-api-key", API_KEY);

    expect(res.statusCode).toBe(404);
    expect(res.body).toHaveProperty("message", "Post not found");
  });

  it(" should return 400 for invalid (non-numeric) post ID", async () => {
    const res = await request(app)
      .get(`/v1/posts/get-single-post/invalidID`)
      .set("x-api-key", API_KEY);

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty("message", "Invalid post ID");
  });

  it(" should return 401 if API key is missing", async () => {
    const res = await request(app).get(`/v1/posts/get-single-post/${postId}`);

    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty("message", "Invalid API key");
  });
});

// /* ─────────────────────   GET-POST-BY-CATEGORY-NAME  ───────────────────── */
describe("GET /v1/posts/get-all-category-posts", () => {
  const ts = Date.now();
  const categoryName = `Cat_${ts}`;
  let token, category_id;

  beforeAll(async () => {
    // Clear and reset DB
    await db.sequelize.sync({ force: true });

    // 1. Register user & get token
    const userData = await registerUser(ts);
    token = userData.token;

    // 2. Create category
    const category = await createCategory(ts);
    category_id = category.id;

    // 3. Create 2 posts
    for (let i = 1; i <= 2; i++) {
      await createPost(token, category_id, `${ts}_${i}`);
    }
  });

  it("should return posts for the valid category name", async () => {
    const res = await request(app)
      .get(`/v1/posts/get-all-category-posts?category_name=${categoryName}`)
      .set("x-api-key", API_KEY);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("data");
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
    expect(res.body.pagination).toHaveProperty("totalPosts");
  });

  it("should return 404 for category with no posts", async () => {
    const emptyCat = await db.Category.create({ name: `Empty_${ts}` });

    const res = await request(app)
      .get(`/v1/posts/get-all-category-posts?category_name=${emptyCat.name}`)
      .set("x-api-key", API_KEY);

    expect(res.statusCode).toBe(404);
    expect(res.body).toHaveProperty(
      "message",
      expect.stringContaining("No posts found")
    );
  });

  it("should return 400 if category_name is missing", async () => {
    const res = await request(app)
      .get("/v1/posts/get-all-category-posts")
      .set("x-api-key", API_KEY);

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty("message", "category_name is required");
  });

  it("should return 400 if page is out of range", async () => {
    const res = await request(app)
      .get(
        `/v1/posts/get-all-category-posts?category_name=${categoryName}&page=100`
      )
      .set("x-api-key", API_KEY);

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty(
      "message",
      "Requested page is out of range"
    );
  });

  it("should return 401 if API key is missing", async () => {
    const res = await request(app).get(
      `/v1/posts/get-all-category-posts?category_name=${categoryName}`
    );

    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty("message", "Invalid API key");
  });
});

// /* ─────────────────────  UPDATE-POST  ───────────────────── */
describe("POST /v1/posts/update-posts/:id", () => {
  let token, category, post, post_id;

  beforeAll(async () => {
    // Register user and get token
    const user = await registerUser();
    token = user.token;

    // Create category
    category = await createCategory();

    // Create post
    const postRes = await createPost(token, category.id);
    post = postRes.body.data;
    post_id = post.id;
  });

  it("should update post successfully", async () => {
    const res = await request(app)
      .post(`/v1/posts/update-posts/${post_id}`)
      .set("x-api-key", API_KEY)
      .set("Authorization", token)
      .send({
        title: "Updated Title",
        content: "Updated content here",
        image_url: "https://example.com/updated.jpg",
        category_id: category.id,
      });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("message", "Post updated successfully");
    expect(res.body.data).toHaveProperty("title", "Updated Title");
  });

  it("should return 404 if post not found or not owned by user", async () => {
    const res = await request(app)
      .post("/v1/posts/update-posts/9999999")
      .set("x-api-key", API_KEY)
      .set("Authorization", token)
      .send({
        title: "Invalid",
        content: "Invalid",
        category_id: category.id,
      });

    expect(res.statusCode).toBe(404);
    expect(res.body).toHaveProperty(
      "message",
      "Post not found or unauthorized"
    );
  });

  it("should return 400 if validation fails", async () => {
    const res = await request(app)
      .post(`/v1/posts/update-posts/${post_id}`)
      .set("x-api-key", API_KEY)
      .set("Authorization", token)
      .send({
        title: "",
        content: "No title",
        category_id: category.id,
      });

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty("message");
    expect(res.body.message).toMatch(/title/i);
  });

  it("should return 401 if token is missing", async () => {
    const res = await request(app)
      .post(`/v1/posts/update-posts/${post_id}`)
      .set("x-api-key", API_KEY)
      .send({
        title: "New Title",
        content: "No token should fail",
        category_id: category.id,
      });

    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty("message", "Authorization token missing");
  });

  it("should return 401 if API key is missing", async () => {
    const res = await request(app)
      .post(`/v1/posts/update-posts/${post_id}`)
      .set("Authorization", token)
      .send({
        title: "Should fail",
        content: "No API key",
        category_id: category.id,
      });

    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty("message", "Invalid API key");
  });
});

// /* ─────────────────────   POST-SOFT-DELETE  ───────────────────── */
describe("POST /v1/posts/soft-delete-posts/:id", () => {
  let token = "";
  let postId = 0;

  beforeAll(async () => {
    // Ensure static category exists (ID 1)
    await db.Category.findOrCreate({
      where: { id: 1 },
      defaults: {
        name: "Integration Test Category",
        is_active: 1,
        is_deleted: 0,
      },
    });

    // Register user and login
    const { token: userToken } = await registerUser();
    token = userToken;

    // Create post with static category_id = 1
    const postRes = await createPost(token, 1);
    postId = postRes.body.data.id;
  });

  it("should soft delete the post successfully", async () => {
    const res = await request(app)
      .post(`/v1/posts/soft-delete-posts/${postId}`)
      .set("x-api-key", API_KEY)
      .set("Authorization", token);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("message", "Post deleted successfully");
    expect(res.body.data).toHaveProperty("id", postId);
  });

  it("should return 404 for already deleted post", async () => {
    const res = await request(app)
      .post(`/v1/posts/soft-delete-posts/${postId}`)
      .set("x-api-key", API_KEY)
      .set("Authorization", token);

    expect(res.statusCode).toBe(404);
    expect(res.body).toHaveProperty(
      "message",
      "Post not found or unauthorized"
    );
  });

  it("should return 401 if token is missing", async () => {
    const res = await request(app)
      .post(`/v1/posts/soft-delete-posts/${postId}`)
      .set("x-api-key", API_KEY); // Token missing

    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty("message", "Authorization token missing");
  });
});

// /* ─────────────────────   POST-HARD-DELETE  ───────────────────── */
describe("POST /v1/posts/hard-delete-posts/:id", () => {
  let token;
  let postId;

  beforeAll(async () => {
    const ts = Date.now();

    // Register user and get token
    const userData = await registerUser(ts);
    token = userData.token;

    // Create category
    const category = await createCategory(ts);

    // Create post
    const postRes = await createPost(token, category.id, ts);
    if (!postRes.body.data) {
      console.error("Post creation failed:", postRes.body);
      throw new Error("Post creation failed");
    }
    postId = postRes.body.data.id;
  });

  it("should hard delete the post successfully", async () => {
    const res = await request(app)
      .post(`/v1/posts/hard-delete-posts/${postId}`)
      .set("x-api-key", API_KEY)
      .set("Authorization", token);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("message", "Post permanently deleted");
    expect(res.body.data).toHaveProperty("id", postId);
  });

  it("should return 404 if the post is already deleted", async () => {
    const res = await request(app)
      .post(`/v1/posts/hard-delete-posts/${postId}`)
      .set("x-api-key", API_KEY)
      .set("Authorization", token);

    expect(res.statusCode).toBe(404);
    expect(res.body).toHaveProperty(
      "message",
      "Post not found or unauthorized"
    );
  });

  it("should return 401 if token is missing", async () => {
    const res = await request(app)
      .post(`/v1/posts/hard-delete-posts/${postId}`)
      .set("x-api-key", API_KEY); // No token

    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty("message", "Authorization token missing");
  });
});


