const { createMetroConfiguration } = require('expo-yarn-workspaces');

const baseConfig = createMetroConfiguration(__dirname);

const assetsLocationsRewrites = {
  // @react-navigation/stack is hoisted to root node_modules
  '/node_modules/@react-navigation/stack': '../../node_modules/@react-navigation/stack',
};

module.exports = {
  ...baseConfig,

  // NOTE(brentvatne): This can be removed when
  // https://github.com/facebook/metro/issues/290 is fixed.
  server: {
    enhanceMiddleware: middleware => {
      return (req, res, next) => {
        // When an asset is imported outside the project root, it has wrong path on Android
        // This happens for the back button in stack, so we fix the path to correct one
        for (const [rewriteFrom, rewriteTo] of Object.entries(assetsLocationsRewrites)) {
          if (req.url.startsWith(rewriteFrom)) {
            req.url = req.url.replace(rewriteFrom, `/assets/${rewriteTo}`);
          }
        }

        return middleware(req, res, next);
      };
    },
  },
};
