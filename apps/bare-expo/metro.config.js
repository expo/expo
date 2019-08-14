const { createMetroConfiguration } = require('expo-yarn-workspaces');

const blacklist = require('metro-config/src/defaults/blacklist');
const config = createMetroConfiguration(__dirname);

module.exports = {
  ...config,
  resolver: {
    ...(config.resolver || {}),
    blacklistRE: blacklist([
      /.*\/ios\/.*/,
      /.*\/android\/ReactAndroid\/.*/,
      /.*\/versioned-react-native\/.*/,
    ]),
  },
};
