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
    '^framer-motion$': '<rootDir>/node_modules/framer-motion/dist/cjs/index.js',
    '^@fingerprintjs/fingerprintjs-pro-react$':
      '<rootDir>/node_modules/@fingerprintjs/fingerprintjs-pro-react/dist/fp-pro-react.cjs.js',
  },
  transform: {},
  extensionsToTreatAsEsm: ['.ts', '.tsx'],
};

export default nextJest({ dir: './' })(jestConfig);
