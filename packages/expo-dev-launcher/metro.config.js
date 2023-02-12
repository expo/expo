const { createMetroConfiguration } = require('expo-yarn-workspaces');
const path = require('path');

const config = createMetroConfiguration(__dirname);

config.server = {
  enhanceMiddleware: (middleware) => {
    return (req, res, next) => {
      const url = new URL(req.url, `http://${req.headers.host}`);
      const platform = url.searchParams.get('platform');

      // When an asset is imported outside the project root, it has wrong path on Android
      // This happens in react-navigation and expo-dev-client-components

      // The back button in stack is required by the launcher, so we fix the path to correct one
      const rnNavigationAssets = '/node_modules/@react-navigation/stack/src/views/assets';

      if (platform === 'android' && req.url.startsWith(rnNavigationAssets)) {
        req.url = req.url.replace(rnNavigationAssets, `/assets/../..${rnNavigationAssets}`);
      }

      // The icons in dev-client-components
      if (platform === 'android' && /\/assets\/.+\.png\?.+$/.test(req.url)) {
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
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (platform === 'ios' && /Components\/StatusBar\/StatusBar/.test(moduleName)) {
    console.log(`Replacing ${moduleName} with NOOP`);
    return {
      type: 'sourceFile',
      filePath: path.join(__dirname, 'bundle', 'StatusBarMock.js'),
    };
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
