import nextJest from 'next/jest.js';

/** @type {import('@jest/types').Config.InitialOptions} */
const jestConfig = {
  displayName: 'docs',
  testEnvironment: 'jsdom',
  testMatch: ['**/*.test.(js|ts|tsx)'],
  setupFilesAfterEnv: ['@testing-library/jest-dom/extend-expect'],
  clearMocks: true,
  coverageDirectory: '<rootDir>/coverage',
  moduleNameMapper: {
    // 'react-markdown': '<rootDir>/node_modules/react-markdown/react-markdown.min.js',
    '^~/(.*)$': '<rootDir>/$1',
  },
  // transformIgnorePatterns: [
  //   'node_modules/(?!react-markdown)/'
  // ],
  transform: {},
  // extensionsToTreatAsEsm: ['.ts', '.tsx'],
  // globals: {
  //   'ts-jest': {
  //     useESM: true,
  //   },
  // },
  snapshotSerializers: ['@emotion/jest/serializer'],
};

export default nextJest({ dir: './' })(jestConfig);
