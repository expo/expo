const path = require('path');

const config = require('./metro.config.js');
const baseResolveRequest = config.resolver.resolveRequest;
const expoWidgetsStubPath = path.join(__dirname, 'bundle/layout-registry-stub.ts');
const asyncRequireStubPath = path.join(__dirname, 'bundle/async-require-stub.ts');
const emptyModuleStubPath = path.join(__dirname, 'bundle/empty-module-stub.js');
const fileSpecifierRe = /^[\\/]|^\.\.?(?:$|[\\/])/i;

config.resolver = {
  ...config.resolver,
  resolveRequest(context, moduleName, platform) {
    if (fileSpecifierRe.test(moduleName)) {
      return baseResolveRequest(context, moduleName, platform);
    }
    if (moduleName === 'expo-widgets') {
      return { type: 'sourceFile', filePath: expoWidgetsStubPath };
    }
    if (
      moduleName === 'metro-runtime/src/modules/asyncRequire' ||
      moduleName === 'expo/internal/async-require-module'
    ) {
      return { type: 'sourceFile', filePath: asyncRequireStubPath };
    }
    return { type: 'empty' };
  },
};

module.exports = config;
