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
    '^@radix-ui/react-dropdown-menu$':
      '<rootDir>/node_modules/@radix-ui/react-dropdown-menu/dist/index.js',
    '^@radix-ui/react-select$': '<rootDir>/node_modules/@radix-ui/react-select/dist/index.js',
    '^framer-motion$': '<rootDir>/node_modules/framer-motion/dist/cjs/index.js',
    '^@fingerprintjs/fingerprintjs-pro-react$':
      '<rootDir>/node_modules/@fingerprintjs/fingerprintjs-pro-react/dist/fp-pro-react.cjs.js',
    '^@sanity/client$': '<rootDir>/node_modules/@sanity/client/dist/index.cjs',
    '^nanoid/index.browser.js$': '<rootDir>/node_modules/nanoid/index.browser.cjs',
    '^nanoid$': '<rootDir>/node_modules/nanoid/index.cjs',
    '^nanoid/non-secure$': '<rootDir>/node_modules/nanoid/non-secure/index.cjs',
    // c15t (used by our cookie consent) bundles CSS modules that jsdom cannot parse
    '^@expo/styleguide-cookie-consent$':
      '<rootDir>/node_modules/@expo/styleguide-cookie-consent/mock.js',
  },
  transform: {},
  extensionsToTreatAsEsm: ['.ts', '.tsx'],
};

export default nextJest({ dir: './' })(jestConfig);
