import nextJest from 'next/jest.js';

/** @type {import('@jest/types').Config.InitialOptions} */
const jestConfig = {
  displayName: 'docs',
  testEnvironment: 'jsdom',
  testMatch: ['**/*.test.(js|ts|tsx)'],
  setupFilesAfterEnv: ['@testing-library/jest-dom/extend-expect', './jest.setup.js'],
  clearMocks: true,
  coverageDirectory: '<rootDir>/coverage',
  moduleNameMapper: {
    '^~/(.*)$': '<rootDir>/$1',
  },
};

export default nextJest({ dir: './' })(jestConfig);
