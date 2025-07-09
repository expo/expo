import nextJest from 'next/jest.js';

/** @type {import('jest').Config} */
const jestConfig = {
  displayName: 'docs',
  testEnvironment: 'jsdom',
  testMatch: ['**/*.test.(js|ts|tsx)'],
  setupFilesAfterEnv: ['@testing-library/jest-dom/jest-globals'],
  clearMocks: true,
  moduleNameMapper: {
    '^~/(.*)$': '<rootDir>/$1',
    // note(simek): force Jest to use non ESM bundle
    '^@radix-ui/react-select$': '<rootDir>/node_modules/@radix-ui/react-select/dist/index.js',
  },
  transform: {},
  extensionsToTreatAsEsm: ['.ts', '.tsx'],
};

export default nextJest({ dir: './' })(jestConfig);
