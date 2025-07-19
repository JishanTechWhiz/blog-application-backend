const request = require("supertest");
const app = require("../../app");
const db = require("../../models");
const helper = require("../../utilities/helper");

const API_KEY = "MyBlogAPIProject";

/* ─────────────────────  REGISTRATION  ───────────────────── */
describe("User Registration API", () => {
  let testEmail, testUsername;

  beforeAll(async () => {
    await db.sequelize.sync({ force: true }); // Ensures fresh DB
  });

  beforeEach(() => {
    const ts = Date.now().toString() + Math.floor(Math.random() * 10000);
    testEmail = `test_${ts}@example.com`;
    testUsername = `testuser_${ts}`;
  });

  test("should register a new user successfully", async () => {
    const response = await request(app)
      .post("/v1/user/register")
      .set("x-api-key", API_KEY)
      .send({
        fullname: "Test User",
        username: testUsername,
        email: testEmail,
        password: "Password@123",
        country_code: "+91",
        phone: "9876543210",
        profile_pic: "https://example.com/test.png",
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty("code", 200);
    expect(response.body).toHaveProperty("message", "Signup successful");
    expect(response.body.data).toHaveProperty("id");
    expect(response.body.data).toHaveProperty("email", testEmail);
  });

  test("should fail if email already exists", async () => {
    // First register the user
    await db.User.create({
      fullname: "Initial User",
      username: testUsername,
      email: testEmail,
      password: "hashed_password", // bypass hashing for test
    });

    const response = await request(app)
      .post("/v1/user/register")
      .set("x-api-key", API_KEY)
      .send({
        fullname: "Duplicate User",
        username: `another_${testUsername}`,
        email: testEmail,
        password: "Password@123",
      });

    expect(response.status).toBe(409);
    expect(response.body).toHaveProperty("code", 409);
    expect(response.body).toHaveProperty("message");
    expect(response.body.message).toMatch(/Email .* already exists/);
  });

  test("should fail if API key is missing", async () => {
    const response = await request(app)
      .post("/v1/user/register")
      .send({
        fullname: "No API Key User",
        username: `noapikey_${Date.now()}`,
        email: `noapikey_${Date.now()}@example.com`,
        password: "Password@123",
      });

    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty("message");
  });
});

/* ─────────────────────  LOGIN  ───────────────────── */
describe("User Login Integration Test", () => {
  let registeredUser;

  beforeAll(async () => {
    await db.sequelize.sync({ force: true }); // Clear and re-init DB

    const hashedPassword = await helper.hashPassword("Test@123");

    // Register a test user directly in DB
    registeredUser = await db.User.create({
      fullname: "testfull",
      username: "testuser",
      email: "testuser@example.com",
      phone: "9876543210",
      password: hashedPassword,
      login_type: "normal",
      is_active: 1,
      is_verified: 1,
      is_deleted: 0,
    });
  });

  test("should login successfully with correct credentials", async () => {
    const response = await request(app)
      .post("/v1/user/login")
      .set("x-api-key", API_KEY)
      .send({
        login_email_phone: "testuser@example.com",
        password: "Test@123",
      });

    expect(response.statusCode).toBe(200);
    expect(response.body.code).toBe(200);
    expect(response.body.message).toBe("Login successful");
    expect(response.body.data.user).toHaveProperty("token");
  });

  test("should fail with invalid password", async () => {
    const response = await request(app)
      .post("/v1/user/login")
      .set("x-api-key", API_KEY)
      .send({
        login_email_phone: "testuser@example.com",
        password: "WrongPass",
      });

    expect(response.statusCode).toBe(401);
    expect(response.body.code).toBe(401);
    expect(response.body.message).toBe("Invalid credentials");
  });

  test("should fail with missing fields", async () => {
    const response = await request(app)
      .post("/v1/user/login")
      .set("x-api-key", API_KEY)
      .send({});

    expect(response.statusCode).toBe(400);
    expect(response.body.code).toBe(400);
    expect(response.body.message).toBe("Email or phone is required");
  });

  test("should fail for non-existing user", async () => {
    const response = await request(app)
      .post("/v1/user/login")
      .set("x-api-key", API_KEY)
      .send({
        login_email_phone: "nouser@example.com",
        password: "AnyPass123",
      });

    expect(response.statusCode).toBe(401);
    expect(response.body.code).toBe(401);
    expect(response.body.message).toBe("Invalid credentials");
  });
});

/* ────────────────  FORGOT‑PASSWORD  (change)  ───────────── */
describe("POST /v1/user/forgot-password", () => {
  const ts = Date.now().toString() + Math.floor(Math.random() * 10000);
  const email = `fp_${ts}@mail.com`;
  const oldPassword = "oldPass123";
  const newPassword = "newPass456";
  let jwtToken = "";

  beforeAll(async () => {
    // Register the user
    const regRes = await request(app)
      .post("/v1/user/register")
      .set("x-api-key", API_KEY)
      .send({
        fullname: "FP User",
        username: `fpuser_${ts}`,
        email,
        password: oldPassword,
        phone: `${ts.toString().slice(5)}`,
      });

    expect(regRes.statusCode).toBe(201);
    expect(regRes.body).toHaveProperty("code", 200);

    // Login and get JWT
    const loginRes = await request(app)
      .post("/v1/user/login")
      .set("x-api-key", API_KEY)
      .send({
        login_email_phone: email,
        password: oldPassword,
      });

    expect(loginRes.statusCode).toBe(200);
    expect(loginRes.body).toHaveProperty("data.user.token");

    jwtToken = loginRes.body.data.user.token;
  });

  it("should change password successfully", async () => {
    const res = await request(app)
      .post("/v1/user/forgot-password")
      .set("x-api-key", API_KEY)
      .set("Authorization", jwtToken)
      .send({
        old_password: oldPassword,
        new_password: newPassword,
      });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("message", "Password changed successfully");
    expect(res.body).toHaveProperty("code", 200);
  });

  it("should return 401 for wrong old password", async () => {
    const res = await request(app)
      .post("/v1/user/forgot-password")
      .set("x-api-key", API_KEY)
      .set("Authorization", jwtToken)
      .send({
        old_password: "wrongOld!",
        new_password: "doesNotMatter123",
      });

    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty("message", "Old password does not match");
  });

  it("should fail when new_password is missing", async () => {
    const res = await request(app)
      .post("/v1/user/forgot-password")
      .set("x-api-key", API_KEY)
      .set("Authorization", jwtToken)
      .send({
        old_password: oldPassword,
      });

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty("message");
  });

  it("should return 401 when token is missing", async () => {
    const res = await request(app)
      .post("/v1/user/forgot-password")
      .set("x-api-key", API_KEY)
      .send({
        old_password: oldPassword,
        new_password: newPassword,
      });

    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty("message", "Authorization token missing");
  });
});

/* ────────────────  RESET‑PASSWORD  ─────────────── */
describe("POST /v1/user/reset-password", () => {
  const ts = Date.now();
  const email = `test_reset_${ts}@mail.com`;
  const oldPassword = "OldPass@123";
  const newPassword = "NewPass@456";
  let token;

  beforeAll(async () => {
    await db.sequelize.sync({ force: true });

    // Register normal user
    await request(app)
      .post("/v1/user/register")
      .set("x-api-key", API_KEY)
      .send({
        fullname: "Reset User",
        username: `reset_user_${ts}`,
        email: email,
        password: oldPassword,
        phone: `${ts.toString().slice(5)}`,
      });

    // Login and get token
    const res = await request(app)
      .post("/v1/user/login")
      .set("x-api-key", API_KEY)
      .send({
        login_email_phone: email,
        password: oldPassword,
      });

    token = res.body?.data?.user?.token;
  });

  it("should successfully reset password", async () => {
    const res = await request(app)
      .post("/v1/user/reset-password")
      .set("x-api-key", API_KEY)
      .set("Authorization", token)
      .send({ new_password: newPassword });

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe("Password reset successful");

    // Verify new password works
    const loginRes = await request(app)
      .post("/v1/user/login")
      .set("x-api-key", API_KEY)
      .send({
        login_email_phone: email,
        password: newPassword,
      });

    expect(loginRes.statusCode).toBe(200);
    expect(loginRes.body?.data?.user?.email).toBe(email);
  });

  it("should fail if new_password is missing", async () => {
    const res = await request(app)
      .post("/v1/user/reset-password")
      .set("x-api-key", API_KEY)
      .set("Authorization", token)
      .send({});

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty("message");
  });

  it("should return 401 if token is missing", async () => {
    const res = await request(app)
      .post("/v1/user/reset-password")
      .set("x-api-key", API_KEY)
      .send({ new_password: "anypass123" });

    expect(res.statusCode).toBe(401);
  });

  it("should return 403 for social login user", async () => {
    const socialTs = Date.now();
    const socialEmail = `social_${socialTs}@mail.com`;
    const socialId = `gid_${socialTs}`;

    // Register via social login
    await request(app)
      .post("/v1/user/register")
      .set("x-api-key", API_KEY)
      .send({
        fullname: "Google User",
        username: `guser_${socialTs}`,
        email: socialEmail,
        social_id: socialId,
        password: null,
      });

    // Social login
    const loginRes = await request(app)
      .post("/v1/user/login")
      .set("x-api-key", API_KEY)
      .send({
        login_email_phone: socialEmail,
        social_id: socialId,
      });

    const socialToken = loginRes.body?.data?.user?.token;

    // Attempt reset password
    const res = await request(app)
      .post("/v1/user/reset-password")
      .set("x-api-key", API_KEY)
      .set("Authorization", socialToken)
      .send({ new_password: "anyNewPass123" });

    expect(res.statusCode).toBe(403);
    expect(res.body.message).toMatch(/not allowed/i);
  });
});

/* ────────────────  EDIT-PROFILE  ─────────────── */
describe("POST /v1/user/edit-profile", () => {
  const ts = Date.now().toString() + Math.floor(Math.random() * 10000);
  const email = `edit_${ts}@mail.com`;
  const password = "editPass123";
  let token = "";
  let userId = 0;

  beforeAll(async () => {
    await db.sequelize.sync({ force: true });

    // Register new user
    const registerRes = await request(app)
      .post("/v1/user/register")
      .set("x-api-key", API_KEY)
      .send({
        fullname: "Edit Tester",
        username: `edituser_${ts}`,
        email,
        password,
        country_code: "+91",
        phone: `${ts.toString().slice(5)}`,
      });

    expect(registerRes.statusCode).toBe(201);

    // Login and get JWT token
    const loginRes = await request(app)
      .post("/v1/user/login")
      .set("x-api-key", API_KEY)
      .send({
        login_email_phone: email,
        password,
      });

    expect(loginRes.statusCode).toBe(200);
    token = loginRes.body.data.user.token;
    userId = loginRes.body.data.user.id;
  });

  it("should update profile successfully", async () => {
    const res = await request(app)
      .post("/v1/user/edit-profile")
      .set("x-api-key", API_KEY)
      .set("Authorization", token)
      .send({
        fullname: "Updated Tester",
        profile_pic: "https://example.com/image.png",
        phone: `${ts.toString().slice(6)}9`,
      });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("message", "Profile updated successfully");
    expect(res.body.data).toHaveProperty("username");
  });

  it("should fail without token", async () => {
    const res = await request(app)
      .post("/v1/user/edit-profile")
      .set("x-api-key", API_KEY)
      .send({
        fullname: "No Auth",
      });

    expect(res.statusCode).toBe(401);
    expect(res.body.message).toMatch(/token missing/i);
  });

  it("should fail with existing email", async () => {
    const newTS = Date.now();
    const existingEmail = `existing_${newTS}@mail.com`;

    await request(app)
      .post("/v1/user/register")
      .set("x-api-key", API_KEY)
      .send({
        fullname: "User 2",
        username: `user2_${newTS}`,
        email: existingEmail,
        password,
        phone: `${newTS.toString().slice(5)}`,
      });

    const res = await request(app)
      .post("/v1/user/edit-profile")
      .set("x-api-key", API_KEY)
      .set("Authorization", token)
      .send({ email: existingEmail });

    expect(res.statusCode).toBe(409);
    expect(res.body.message).toMatch(/already exists/i);
  });

  it("should fail with existing username", async () => {
    const newTS = Date.now();
    const existingUsername = `existingUser_${newTS}`;

    await request(app)
      .post("/v1/user/register")
      .set("x-api-key", API_KEY)
      .send({
        fullname: "User 3",
        username: existingUsername,
        email: `u3_${newTS}@mail.com`,
        password,
        phone: `${newTS.toString().slice(5)}`,
      });

    const res = await request(app)
      .post("/v1/user/edit-profile")
      .set("x-api-key", API_KEY)
      .set("Authorization", token)
      .send({ username: existingUsername });

    expect(res.statusCode).toBe(409);
    expect(res.body.message).toMatch(/already exists/i);
  });

  it("should fail with existing phone", async () => {
    const newTS = Date.now();
    const existingPhone = `${newTS.toString().slice(5)}`;

    await request(app)
      .post("/v1/user/register")
      .set("x-api-key", API_KEY)
      .send({
        fullname: "User 4",
        username: `user4_${newTS}`,
        email: `u4_${newTS}@mail.com`,
        password,
        phone: existingPhone,
      });

    const res = await request(app)
      .post("/v1/user/edit-profile")
      .set("x-api-key", API_KEY)
      .set("Authorization", token)
      .send({ phone: existingPhone });

    expect(res.statusCode).toBe(409);
    expect(res.body.message).toMatch(/already exists/i);
  });
});

