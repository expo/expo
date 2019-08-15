const path = require('path');
const { createMetroConfiguration } = require('expo-yarn-workspaces');

const blacklist = require('metro-config/src/defaults/blacklist');
const config = createMetroConfiguration(__dirname);

const blacklistRE = blacklist([
  // [Custom] Prevent the haste collision in `ios/` versioned code.
  // Otherwise you will get an error from Metro bundler.
  /.*\/android\/ReactAndroid\/.*/,
  /.*\/versioned-react-native\/.*/,
]);
module.exports = {
  ...config,
  watchFolders: [path.resolve(__dirname, '../../packages')],
  resolver: {
    ...(config.resolver || {}),
    blacklistRE,
  },
  getBlackListRE() {
    return blacklistRE;
  },
};
