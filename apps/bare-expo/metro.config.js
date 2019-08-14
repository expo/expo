const { createMetroConfiguration } = require('expo-yarn-workspaces');

const blacklist = require('metro-config/src/defaults/blacklist');
const config = createMetroConfiguration(__dirname);

module.exports = {
  ...config,
  resolver: {
    ...(config.resolver || {}),
    blacklistRE: blacklist([
      // [Custom] Prevent the haste collision in `ios/` versioned code.
      // Otherwise you will get an error from Metro bundler.
      /.*\/ios\/.*/,
      /.*\/android\/ReactAndroid\/.*/,
      /.*\/versioned-react-native\/.*/,
    ]),
  },
};
