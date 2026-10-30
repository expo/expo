const path = require('path');

/** @type {import('jest').Config} */
module.exports = {
  ...require('@expo/internal-scripts/jest-preset-cli'),
  displayName: require('./package').name,
  rootDir: __dirname,
  roots: ['src'],
  // The same copy of the macros as in `tsconfig.json`.
  moduleNameMapper: {
    '^expo-modules-macros$': path.join(
      __dirname,
      '../expo-modules-core/node_modules/expo-modules-macros'
    ),
  },
};
