const { createMetroConfiguration } = require('expo-yarn-workspaces');

const config = createMetroConfiguration(__dirname);

config.server = {
  enhanceMiddleware: (middleware) => {
    return (req, res, next) => {
      const url = new URL(req.url, `http://${req.headers.host}`);
      const platform = url.searchParams.get('platform');

      // When an asset is imported outside the project root, it has wrong path on Android
      // So we fix the path to correct one
      if (platform === 'android' && /\/assets\/.+\.(png|jpg|jpeg)\?.+$/.test(req.url)) {
        req.url = `/assets/../${req.url}`;
      }

      return middleware(req, res, next);
    };
  },
};

const { EXPO_BUNDLE_APP } = process.env;

if (EXPO_BUNDLE_APP) {
  config.transformer.enableBabelRCLookup = true;
}

config.resolver.blockList.push(/\breact-native-lab\b/);

module.exports = config;
