/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  // Use ts-jest as the preset
  preset: 'ts-jest',

  // Set the test environment to 'node' (since you're using 'fs')
  testEnvironment: 'node',

  // (Optional) Automatically clear mock calls and instances between every test
  clearMocks: true,
};
