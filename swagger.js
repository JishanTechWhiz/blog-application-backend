const swaggerJSDoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Blog API",
      version: "1.0.0",
      description: "Blog application APIs with user authentication",
    },
    servers: [
      {
        url: "http://localhost:5000",
      },
    ],
    components: {
      securitySchemes: {
        ApiKeyAuth: {
          type: "apiKey",
          in: "header",
          name: "x-api-key",
        },
        JWTAuth: {
          type: "apiKey",
          in: "header",
          name: "Authorization", 
        },
      },
    },
    security: [
      {
        ApiKeyAuth: [],
      },
      {
        JWTAuth: [],
      },
    ],
  },
  apis: [
    "./modules/v1/user/route/user.routes.js",
    "./modules/v1/user/controller/user.controller.js",
    "./modules/v1/post/route/post.routes.js",
    "./modules/v1/post/controller/post.controller.js",
    "./modules/v1/comment/route/comment.routes.js",
    "./modules/v1/comment/controller/comment.controller.js",
  ],
};

const swaggerSpec = swaggerJSDoc(options);

module.exports = {
  swaggerUi,
  swaggerSpec,
};
