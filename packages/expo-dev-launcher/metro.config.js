const { createMetroConfiguration } = require('expo-yarn-workspaces');

const config = createMetroConfiguration(__dirname);

config.server = {
  enhanceMiddleware: (middleware) => {
    return (req, res, next) => {
      // When an asset is imported outside the project root, it has wrong path on Android
      // So we fix the path to correct one
      if (/\/assets\/.+\.png\?.+$/.test(req.url)) {
        req.url = `/assets/../${req.url}`;
      }

      return middleware(req, res, next);
    };
  },
};

module.exports = config;
