// `src` tests run on the multi-platform module preset and the config plugin's tests run as their
// own `plugin` project, so a single `jest` invocation covers the whole package.
/** @type {import('jest').Config} */
module.exports = require('expo-module-scripts/createCompositeJestPreset')(__dirname, ['plugin']);
