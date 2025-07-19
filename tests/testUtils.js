// testUtils.js
const request = require("supertest");
const app = require("../app");
const db = require("../models");

const API_KEY = process.env.API_KEY || "MyBlogAPIProject";

const registerUser = async (timestamp = Date.now()) => {
  const email = `user_${timestamp}@mail.com`;
  const password = "TestPass123";
  const username = `user_${timestamp}`;
  const phone = `9${timestamp.toString().slice(5)}`;

  await request(app)
    .post("/v1/user/register")
    .set("x-api-key", API_KEY)
    .send({
      fullname: "Test User",
      username,
      email,
      password,
      country_code: "+91",
      phone,
    });

  const loginRes = await request(app)
    .post("/v1/user/login")
    .set("x-api-key", API_KEY)
    .send({ login_email_phone: email, password });

  if (!loginRes.body.data?.user?.token) {
    throw new Error("Login failed during test setup");
  }

  return {
    token: loginRes.body.data.user.token,
    userId: loginRes.body.data.user.id,
  };
};

const createCategory = async (timestamp = Date.now()) => {
  return await db.Category.create({ name: `cat_${timestamp}` });
};

const createPost = async (token, categoryId, timestamp = Date.now()) => {
  return await request(app)
    .post("/v1/posts/create-posts")
    .set("x-api-key", API_KEY)
    .set("Authorization", token)
    .send({
      title: `Title_${timestamp}`,
      content: "Post content",
      image_url: "https://image.url/test.png",
      category_id: categoryId,
    });
};

const createComment = async (token, postId) => {
  return await request(app)
    .post("/v1/comments/create-comments")
    .set("x-api-key", API_KEY)
    .set("Authorization", token)
    .send({ post_id: postId, comment: "Test comment" });
};

module.exports = {
  registerUser,
  createCategory,
  createPost,
  createComment,
};
