const request = require("supertest");
const app = require("../../app"); 
const db = require("../../models"); 

const API_KEY = "MyBlogAPIProject"; 

/* ─────────────────────  REGISTRATION  ───────────────────── */
describe("POST /v1/user/register", () => {
  it("should register a user successfully", async () => {
    const ts = Date.now().toString() + Math.floor(Math.random() * 10000);
    const res = await request(app)
      .post("/v1/user/register")
      .set("x-api-key", API_KEY)
      .send({
        fullname: "Test User",
        username: `testuser_${ts}`,
        email: `test_${ts}@mail.com`,
        password: "password123",
        country_code: "+91",
        phone: `${ts.toString().slice(5)}`,
      });

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty("code", 200);
    expect(res.body).toHaveProperty("message", "Signup successful");
    expect(res.body.data).toHaveProperty("email");
  });

  it("should fail when email is missing", async () => {
    const res = await request(app)
      .post("/v1/user/register")
      .set("x-api-key", API_KEY)
      .send({ fullname: "No Email", username: "nouser", password: "pass" });

    expect(res.statusCode).toBe(400);
  });

  it("should fail when password is missing", async () => {
    const res = await request(app)
      .post("/v1/user/register")
      .set("x-api-key", API_KEY)
      .send({
        fullname: "No Password",
        username: "nopass",
        email: `nopass_${Date.now()}@mail.com`,
      });

    expect(res.statusCode).toBe(400);
  });

  it("should fail on duplicate email", async () => {
    const ts = Date.now();
    const email = `dup_${ts}@mail.com`;

    await request(app)
      .post("/v1/user/register")
      .set("x-api-key", API_KEY)
      .send({
        fullname: "Original",
        username: `dupuser_${ts}`,
        email,
        password: "password123",
      });

    const res = await request(app)
      .post("/v1/user/register")
      .set("x-api-key", API_KEY)
      .send({
        fullname: "Duplicate",
        username: `dupuser2_${ts + 1}`,
        email,
        password: "password123",
      });

    expect(res.statusCode).toBe(409);
  });
});

/* ─────────────────────  LOGIN  ───────────────────── */
describe("POST /v1/user/login", () => {
  const ts = Date.now().toString() + Math.floor(Math.random() * 10000);
  const email = `login_${ts}@mail.com`;
  const password = "oldPass123";

  let token = "";

  beforeAll(async () => {
    // register user
    await request(app)
      .post("/v1/user/register")
      .set("x-api-key", API_KEY)
      .send({
        fullname: "Login User",
        username: `loginuser_${ts}`,
        email,
        password,
        country_code: "+91",
        phone: `${ts.toString().slice(5)}`,
      });
    // obtain token
    const res = await request(app)
      .post("/v1/user/login")
      .set("x-api-key", API_KEY)
      .send({
        login_email_phone: email,
        password,
      });
    token = res.body.data.user.token;
  });

  it("should login successfully", async () => {
    const res = await request(app)
      .post("/v1/user/login")
      .set("x-api-key", API_KEY)
      .send({
        login_email_phone: email,
        password,
      });
    expect(res.statusCode).toBe(200);
    expect(res.body.data.user).toHaveProperty("token");
  });

  it("should reject wrong password", async () => {
    const res = await request(app)
      .post("/v1/user/login")
      .set("x-api-key", API_KEY)
      .send({
        login_email_phone: email,
        password: "wrong!",
      });
    expect(res.statusCode).toBe(401);
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
    // 1. Register the user
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

    // 2. Login and get JWT
    const loginRes = await request(app)
      .post("/v1/user/login")
      .set("x-api-key", API_KEY)
      .send({
        login_email_phone: email,
        password: oldPassword,
      });

    console.log("Login Response:", loginRes.body); // Debug log

    // Check login success
    expect(loginRes.statusCode).toBe(200);
    expect(loginRes.body).toHaveProperty("data.user.token");

    // Assign token safely
    jwtToken = loginRes.body.data.user.token;
  });

  /*  Successful password change */
  it("should change password successfully", async () => {
    const res = await request(app)
      .post("/v1/user/forgot-password")
      .set("x-api-key", API_KEY)
      .set("Authorization", jwtToken)
      .send({ old_password: oldPassword, new_password: newPassword });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("message", "Password changed successfully");
  });

  /* Wrong old password */
  it("should return 401 for wrong old password", async () => {
    const res = await request(app)
      .post("/v1/user/forgot-password")
      .set("x-api-key", API_KEY)
      .set("Authorization", jwtToken)
      .send({ old_password: "wrongOld!", new_password: "doesNotMatter123" });

    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty("message", "Old password does not match");
  });

  /*  Missing new_password */
  it("should fail when new_password is missing", async () => {
    const res = await request(app)
      .post("/v1/user/forgot-password")
      .set("x-api-key", API_KEY)
      .set("Authorization", jwtToken)
      .send({ old_password: oldPassword });

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty("message");
  });

  /* Missing token */
  it("should return 401 when token is missing", async () => {
    const res = await request(app)
      .post("/v1/user/forgot-password")
      .set("x-api-key", API_KEY)
      .send({ old_password: oldPassword, new_password: newPassword });

    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty("message", "Authorization token missing");
  });
});

/* ────────────────  RESET‑PASSWORD  ─────────────── */
describe("POST /v1/user/reset-password", () => {
  const ts = Date.now();
  const email = `rp_${ts}@mail.com`;
  const oldPassword = "oldPass123";
  const resetPassword = "resetPass456";
  let jwtToken = "";

  /* Create a normal user & get JWT */
  beforeAll(async () => {
    await request(app)
      .post("/v1/user/register")
      .set("x-api-key", API_KEY)
      .send({
        fullname: "RP User",
        username: `rpuser_${ts}`,
        email,
        password: oldPassword,
        phone: `${ts.toString().slice(5)}`,
      });

    const res = await request(app)
      .post("/v1/user/login")
      .set("x-api-key", API_KEY)
      .send({
        login_email_phone: email,
        password: oldPassword,
      });
    jwtToken = res.body.data.user.token; // logged‑in => is_login === 1
  });

  /*  successful reset */
  it("should reset password successfully", async () => {
    const res = await request(app)
      .post("/v1/user/reset-password")
      .set("x-api-key", API_KEY)
      .set("Authorization", jwtToken)
      .send({ new_password: resetPassword });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("message", "Password reset successful");

    /* verify user can log in with new password */
    const loginRes = await request(app)
      .post("/v1/user/login")
      .set("x-api-key", API_KEY)
      .send({
        login_email_phone: email,
        password: resetPassword,
      });
    expect(loginRes.statusCode).toBe(200);
  });

  /* missing new_password */
  it("should fail when new_password is missing", async () => {
    const res = await request(app)
      .post("/v1/user/reset-password")
      .set("x-api-key", API_KEY)
      .set("Authorization", jwtToken)
      .send({}); // no new_password

    expect(res.statusCode).toBe(400);
  });

  /* no JWT token */
  it("should return 401 when token is missing", async () => {
    const res = await request(app)
      .post("/v1/user/reset-password")
      .set("x-api-key", API_KEY)
      .send({ new_password: "whatever123" });

    expect(res.statusCode).toBe(401);
  });

  /* social‑login user cannot reset password */
  it("should return 403 for social‑login user", async () => {
    /* 4a create social‑login account */
    const socTs = Date.now();
    const socialEmail = `social_${socTs}@mail.com`;
    const socialId = `gid_${socTs}`;

    await request(app)
      .post("/v1/user/register")
      .set("x-api-key", API_KEY)
      .send({
        fullname: "G‑User",
        username: `guser_${socTs}`,
        email: socialEmail,
        social_id: socialId, // triggers login_type = 'social'
        password: null, // not needed for social
      });

    /* 4b simulate social‑login → obtain token (assuming same endpoint works) */
    const loginRes = await request(app)
      .post("/v1/user/login")
      .set("x-api-key", API_KEY)
      .send({
        login_email_phone: socialEmail,
        social_id: socialId,
      });
    const socialToken = loginRes.body.data.user.token;

    /* 4c attempt reset password */
    const res = await request(app)
      .post("/v1/user/reset-password")
      .set("x-api-key", API_KEY)
      .set("Authorization", socialToken)
      .send({ new_password: "newSocialPass" });

    expect(res.statusCode).toBe(403); // password reset not allowed
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
    // Register user
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

    // Login to get token
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
        fullname: "Updated Name",
        country_code: "+91",
        phone: `${ts.toString().slice(6)}1`, // New phone
        profile_pic: "https://example.com/profile.png",
      });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("message", "Profile updated successfully");
    expect(res.body.data).toHaveProperty("username");
  });

  it("should return 401 if token is missing", async () => {
    const res = await request(app)
      .post("/v1/user/edit-profile")
      .set("x-api-key", API_KEY)
      .send({
        fullname: "No Auth User",
      });

    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty("message", "Authorization token missing");
  });

  it("should return 409 if email already exists", async () => {
    // Register another user with known email
    const newTS = Date.now();
    const existingEmail = `existing_${newTS}@mail.com`;

    await request(app)
      .post("/v1/user/register")
      .set("x-api-key", API_KEY)
      .send({
        fullname: "Conflict User",
        username: `conflictuser_${newTS}`,
        email: existingEmail,
        password,
        phone: `${newTS.toString().slice(5)}`,
      });

    // Try to update to that email
    const res = await request(app)
      .post("/v1/user/edit-profile")
      .set("x-api-key", API_KEY)
      .set("Authorization", token)
      .send({
        email: existingEmail,
      });

    expect(res.statusCode).toBe(409);
    expect(res.body).toHaveProperty(
      "message",
      expect.stringContaining("already exists")
    );
  });

  it("should return 409 if username already exists", async () => {
    const newTS = Date.now();
    const existingUsername = `conflictuser_${newTS}`;

    await request(app)
      .post("/v1/user/register")
      .set("x-api-key", API_KEY)
      .send({
        fullname: "Conflict Username",
        username: existingUsername,
        email: `u_${newTS}@mail.com`,
        password,
        phone: `${newTS.toString().slice(5)}`,
      });

    const res = await request(app)
      .post("/v1/user/edit-profile")
      .set("x-api-key", API_KEY)
      .set("Authorization", token)
      .send({
        username: existingUsername,
      });

    expect(res.statusCode).toBe(409);
    expect(res.body).toHaveProperty(
      "message",
      expect.stringContaining("already exists")
    );
  });

  it("should return 409 if phone already exists", async () => {
    const newTS = Date.now();
    const existingPhone = `${newTS.toString().slice(5)}`;

    await request(app)
      .post("/v1/user/register")
      .set("x-api-key", API_KEY)
      .send({
        fullname: "Conflict Phone",
        username: `phoneuser_${newTS}`,
        email: `p_${newTS}@mail.com`,
        password,
        phone: existingPhone,
      });

    const res = await request(app)
      .post("/v1/user/edit-profile")
      .set("x-api-key", API_KEY)
      .set("Authorization", token)
      .send({
        phone: existingPhone,
      });

    expect(res.statusCode).toBe(409);
    expect(res.body).toHaveProperty(
      "message",
      expect.stringContaining("already exists")
    );
  });
});

/* ───────────────────  GLOBAL TEARDOWN  ──────────────────── */
afterAll(async () => {
  await db.sequelize.close(); // so Jest exits cleanly
});

 