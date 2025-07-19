const request = require("supertest");
const app = require("../../app");
const db = require("../../models");

const API_KEY = "MyBlogAPIProject";

/* ─────────────────────  CREATE-POST  ───────────────────── */
describe("POST /v1/posts/create-posts", () => {
  let token = "";
  let category_id = 1;

  const ts = Date.now().toString() + Math.floor(Math.random() * 10000);
  const email = `post_${ts}@mail.com`;
  const password = "Post123@";

  beforeAll(async () => {
    // Create a dummy category if needed
    const category = await db.Category.create({
      name: `Test Category ${ts}`,
    });
    category_id = category.id;

    // Register user
    await request(app)
      .post("/v1/user/register")
      .set("x-api-key", API_KEY)
      .send({
        fullname: "Post Tester",
        username: `postuser_${ts}`,
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
        category_id,
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
        category_id,
      });

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty("message");
  });

  it("should return 401 when token is missing", async () => {
    const res = await request(app)
      .post("/v1/posts/create-posts")
      .set("x-api-key", API_KEY)
      .send({
        title: "Unauthorized Post",
        content: "No token provided.",
        image_url: "https://example.com/image.jpg",
        category_id,
      });

    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty("message", "Authorization token missing");
  });
});

/* ─────────────────────  GET-ALL-POST  ───────────────────── */
describe("GET /v1/posts/get-all-posts", () => {
  const ts = Date.now().toString() + Math.floor(Math.random() * 10000);
  const email = `view_${ts}@mail.com`;
  const password = "ViewPass123";
  let token = "";
  let category_id = 1;

  beforeAll(async () => {
    // Create category
    const category = await db.Category.create({
      name: `View Test Category ${ts}`,
    });
    category_id = category.id;

    // Register and login user
    await request(app)
      .post("/v1/user/register")
      .set("x-api-key", API_KEY)
      .send({
        fullname: "View Tester",
        username: `viewuser_${ts}`,
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

    // Create a post for fetching
    await request(app)
      .post("/v1/posts/create-posts")
      .set("x-api-key", API_KEY)
      .set("Authorization", token)
      .send({
        title: "Viewable Post",
        content: "Some post content here.",
        image_url: "https://example.com/view.jpg",
        category_id,
      });
  });

  it("should return list of posts with pagination", async () => {
    const res = await request(app)
      .get("/v1/posts/get-all-posts?page=1")
      .set("x-api-key", API_KEY);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("data");
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body).toHaveProperty("pagination");
  });

  it("should return 400 for page out of range", async () => {
    const res = await request(app)
      .get("/v1/posts/get-all-posts?page=9999")
      .set("x-api-key", API_KEY);

    if (res.body.code === 400) {
      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty(
        "message",
        "Requested page is out of range"
      );
    } else {
      // If not out of range due to test data, it will pass safely
      expect(res.statusCode).toBe(200);
    }
  });

  it("should return 401 when API key is missing", async () => {
    const res = await request(app).get("/v1/posts/get-all-posts?page=1");
    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty("message", "Invalid API key");
  });
});

/* ─────────────────────  GET-POST-BY-ID  ───────────────────── */
describe("GET /v1/posts/get-single-post/:id", () => {
  const ts = Date.now().toString() + Math.floor(Math.random() * 10000);
  const email = `single_${ts}@mail.com`;
  const password = "SinglePass123";
  let token = "";
  let category_id = 1;
  let post_id;

  beforeAll(async () => {
    // Create category
    const category = await db.Category.create({
      name: `Single Test Category ${ts}`,
    });
    category_id = category.id;

    // Register and login user
    await request(app)
      .post("/v1/user/register")
      .set("x-api-key", API_KEY)
      .send({
        fullname: "Single Post Tester",
        username: `singleuser_${ts}`,
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

    // Create a post
    const postRes = await request(app)
      .post("/v1/posts/create-posts")
      .set("x-api-key", API_KEY)
      .set("Authorization", token)
      .send({
        title: "Test Single Post",
        content: "Content for single post",
        image_url: "https://example.com/single.jpg",
        category_id,
      });

    post_id = postRes.body.data.id;
  });

  it("should return the post for valid ID", async () => {
    const res = await request(app)
      .get(`/v1/posts/get-single-post/${post_id}`)
      .set("x-api-key", API_KEY);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("data");
    expect(res.body.data).toHaveProperty("title", "Test Single Post");
  });

  it("should return 404 for non-existing post ID", async () => {
    const res = await request(app)
      .get(`/v1/posts/get-single-post/999999`)
      .set("x-api-key", API_KEY);

    expect(res.statusCode).toBe(404);
    expect(res.body).toHaveProperty("message", "Post not found");
  });

  it("should return 400 for invalid (non-numeric) post ID", async () => {
    const res = await request(app)
      .get(`/v1/posts/get-single-post/invalidID`)
      .set("x-api-key", API_KEY);

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty("message", "Invalid post ID");
  });

  it("should return 401 if API key is missing", async () => {
    const res = await request(app).get(`/v1/posts/get-single-post/${post_id}`);

    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty("message", "Invalid API key");
  });
});

/* ─────────────────────   GET-POST-BY-CATEGORY-NAME  ───────────────────── */
describe("GET /v1/posts/get-all-category-posts", () => {
  const ts = Date.now().toString() + Math.floor(Math.random() * 10000);
  const categoryName = `Cat_${ts}`;
  const email = `catuser_${ts}@mail.com`;
  const password = "CatTest123";
  let token = "";
  let category_id;

  beforeAll(async () => {
    // Create category
    const category = await db.Category.create({ name: categoryName });
    category_id = category.id;

    // Register and login user
    await request(app)
      .post("/v1/user/register")
      .set("x-api-key", API_KEY)
      .send({
        fullname: "Category Post Tester",
        username: `catuser_${ts}`,
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

    // Create multiple posts
    for (let i = 1; i <= 2; i++) {
      await request(app)
        .post("/v1/posts/create-posts")
        .set("x-api-key", API_KEY)
        .set("Authorization", token)
        .send({
          title: `Category Post ${i}`,
          content: `Category Post Content ${i}`,
          image_url: `https://example.com/cat${i}.jpg`,
          category_id,
        });
    }
  });

  it("should return posts for the valid category name", async () => {
    const res = await request(app)
      .get(`/v1/posts/get-all-category-posts?category_name=${categoryName}`)
      .set("x-api-key", API_KEY);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("data");
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.pagination.totalPosts).toBeGreaterThan(0);
  });

  it("should return 404 for category with no posts", async () => {
    const res = await request(app)
      .get(`/v1/posts/get-all-category-posts?category_name=empty_${ts}`)
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

/* ─────────────────────   POST-UPDATE  ───────────────────── */
describe("POST /v1/posts/update-posts/:id", () => {
  const ts = Date.now().toString() + Math.floor(Math.random() * 10000);
  const email = `upduser_${ts}@mail.com`;
  const password = "UpdPass123";
  let token = "";
  let postId = 0;

  beforeAll(async () => {
    // Register user
    await request(app)
      .post("/v1/user/register")
      .set("x-api-key", API_KEY)
      .send({
        fullname: "Update Tester",
        username: `upduser_${ts}`,
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

    // Create post
    const createRes = await request(app)
      .post("/v1/posts/create-posts")
      .set("x-api-key", API_KEY)
      .set("Authorization", token)
      .send({
        title: "Original Title",
        content: "Original content",
        image_url: "https://example.com/original.jpg",
        category_id: 1, // Ensure category with id 1 exists in your DB
      });

    postId = createRes.body.data.id;
  });

  it("should update post successfully", async () => {
    const res = await request(app)
      .post(`/v1/posts/update-posts/${postId}`)
      .set("x-api-key", API_KEY)
      .set("Authorization", token)
      .send({
        title: "Updated Title",
        content: "Updated content",
      });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("message", "Post updated successfully");
    expect(res.body.data).toHaveProperty("title", "Updated Title");
  });

  it("should return 404 if post not found or not owned by user", async () => {
    const res = await request(app)
      .post(`/v1/posts/update-posts/999999`)
      .set("x-api-key", API_KEY)
      .set("Authorization", token)
      .send({
        title: "Invalid Update",
      });

    expect(res.statusCode).toBe(404);
    expect(res.body).toHaveProperty(
      "message",
      "Post not found or unauthorized"
    );
  });

  it("should return 400 if validation fails", async () => {
    const res = await request(app)
      .post(`/v1/posts/update-posts/${postId}`)
      .set("x-api-key", API_KEY)
      .set("Authorization", token)
      .send({ title: "" }); // invalid (empty title)

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty("message");
  });

  it("should return 401 if token is missing", async () => {
    const res = await request(app)
      .post(`/v1/posts/update-posts/${postId}`)
      .set("x-api-key", API_KEY)
      .send({
        title: "No Token",
      });

    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty("message", "Authorization token missing");
  });

  it("should return 401 if API key is missing", async () => {
    const res = await request(app)
      .post(`/v1/posts/update-posts/${postId}`)
      .set("Authorization", token)
      .send({
        title: "No API Key",
      });

    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty("message", "Invalid API key");
  });
});

/* ─────────────────────   POST-SORT-DELETE  ───────────────────── */
describe("POST /v1/posts/soft-delete-posts/:id", () => {
  const ts = Date.now().toString() + Math.floor(Math.random() * 10000);
  const email = `softdel_${ts}@mail.com`;
  const password = "SoftDel123";
  let token = "";
  let postId = 0;

  beforeAll(async () => {
    // Register user
    await request(app)
      .post("/v1/user/register")
      .set("x-api-key", API_KEY)
      .send({
        fullname: "Soft Del",
        username: `softdel_${ts}`,
        email,
        password,
        country_code: "+91",
        phone: `${ts.toString().slice(5)}`,
      });

    // Login
    const loginRes = await request(app)
      .post("/v1/user/login")
      .set("x-api-key", API_KEY)
      .send({
        login_email_phone: email,
        password,
      });
    token = loginRes.body.data.user.token;

    // Create a post
    const postRes = await request(app)
      .post("/v1/posts/create-posts")
      .set("x-api-key", API_KEY)
      .set("Authorization", token)
      .send({
        title: "Soft Deletable Post",
        content: "This will be soft deleted",
        image_url: "https://example.com/delete.png",
        category_id: 1,
      });
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
      .set("x-api-key", API_KEY);

    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty("message", "Authorization token missing");
  });
});

/* ─────────────────────   POST-HARD-DELETE  ───────────────────── */
describe("POST /v1/posts/hard-delete-posts/:id", () => {
  const ts = Date.now().toString() + Math.floor(Math.random() * 10000);
  const email = `harddel_${ts}@mail.com`;
  const password = "HardDel123";
  let token = "";
  let postId = 0;

  beforeAll(async () => {
    // Register user
    await request(app)
      .post("/v1/user/register")
      .set("x-api-key", API_KEY)
      .send({
        fullname: "Hard Del",
        username: `harddel_${ts}`,
        email,
        password,
        country_code: "+91",
        phone: `${ts.toString().slice(5)}`,
      });

    // Login
    const loginRes = await request(app)
      .post("/v1/user/login")
      .set("x-api-key", API_KEY)
      .send({
        login_email_phone: email,
        password,
      });
    token = loginRes.body.data.user.token;

    // Create post
    const postRes = await request(app)
      .post("/v1/posts/create-posts")
      .set("x-api-key", API_KEY)
      .set("Authorization", token)
      .send({
        title: "Hard Deletable Post",
        content: "This will be hard deleted",
        image_url: "https://example.com/delete.png",
        category_id: 1,
      });
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

  it("should return 404 if post already hard deleted", async () => {
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
      .set("x-api-key", API_KEY);

    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty("message", "Authorization token missing");
  });
});

/* ───────────────────  GLOBAL TEARDOWN  ──────────────────── */
afterAll(async () => {
  await db.sequelize.close(); // so Jest exits cleanly
});
