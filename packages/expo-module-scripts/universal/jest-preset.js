const withTypeScript = require('../withTypeScript');
module.exports = {
  projects: [
    withTypeScript(require('jest-expo/ios/jest-preset')),
    withTypeScript(require('jest-expo/android/jest-preset')),
    withTypeScript(require('jest-expo/web/jest-preset')),
    withTypeScript(require('jest-expo/node/jest-preset')),
  ],
};
