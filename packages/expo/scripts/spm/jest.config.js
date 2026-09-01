// Dedicated Jest config for the SwiftPM autolinking plugin's unit tests.
// The expo package's main Jest preset scopes its projects to `src/` and runs
// them under React Native (iOS/Android/Web) environments; this plugin is plain
// Node CLI code, so it gets its own Node-environment config here.
module.exports = {
  displayName: 'spm-plugin',
  testEnvironment: 'node',
  rootDir: __dirname,
  testMatch: ['**/__tests__/**/*.test.js'],
  // Plain CommonJS — no transform needed.
  transform: {},
};
