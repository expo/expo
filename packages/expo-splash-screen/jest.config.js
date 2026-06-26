// Plugin-only package (no `src` tests): a single-project composite that runs the config
// plugin's tests, scoped to `plugin/`. (No `src` projects — nothing to run there.)
module.exports = require('expo-module-scripts/createCompositeJestPreset')(__dirname, ['plugin'], {
  srcProjects: [],
});
