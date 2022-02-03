/** @type {import('@jest/types').Config.InitialOptions} */
module.exports = {
  displayName: 'docs',
  testEnvironment: 'jsdom',
  testMatch: ['**/*.test.(js|ts|tsx)'],
  setupFilesAfterEnv: ['@testing-library/jest-dom/extend-expect', './jest.setup.js'],
  clearMocks: true,
  coverageDirectory: '<rootDir>/coverage',
};
