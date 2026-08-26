// The config plugin has its own tests under `plugin/`, and the module preset roots collection at
// `src` — so without this they are collected by nothing and `passWithNoTests` keeps the run green.
// Running `plugin` as its own project means one `jest` invocation covers the whole package.
module.exports = require('expo-module-scripts/createCompositeJestPreset')(__dirname, ['plugin']);
