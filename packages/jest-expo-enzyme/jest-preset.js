const { withWatchPlugins } = require('jest-expo/config');
const { withEnzyme } = require('.');

module.exports = withWatchPlugins({
  projects: [
    withEnzyme(require('jest-expo/ios/jest-preset')),
    withEnzyme(require('jest-expo/android/jest-preset')),
    withEnzyme(require('jest-expo/web/jest-preset')),
  ],
});
