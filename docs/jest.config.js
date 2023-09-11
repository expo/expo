import nextJest from 'next/jest.js';

/** @type {import('jest').Config} */
const jestConfig = {
  displayName: 'docs',
  testEnvironment: 'jsdom',
  testMatch: ['**/*.test.(js|ts|tsx)'],
  setupFilesAfterEnv: ['@testing-library/jest-dom/extend-expect'],
  clearMocks: true,
  moduleNameMapper: {
    '^~/(.*)$': '<rootDir>/$1',
  },
  transform: {},
  extensionsToTreatAsEsm: ['.ts', '.tsx'],
};

export default nextJest({ dir: './' })(jestConfig);
