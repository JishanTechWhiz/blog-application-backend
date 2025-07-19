// jest.config.js
module.exports = {
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
  testEnvironment: "node",
  testTimeout: 30000,
  testMatch: [
    "**/tests/integration/**/*.test.js",
    "**/tests/unit/**/*.test.js",
  ],
};
