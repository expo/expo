const { withWatchPlugins } = require('jest-expo/config');
const withTypeScript = require('../withTypeScript');
module.exports = withWatchPlugins({
  projects: [
    withTypeScript(require('jest-expo/ios/jest-preset')),
    withTypeScript(require('jest-expo/android/jest-preset')),
    withTypeScript(require('jest-expo/web/jest-preset')),
    withTypeScript(require('jest-expo/node/jest-preset')),
  ],
});
