const path = require('path');

const config = require('./metro.config.js');
const baseResolveRequest = config.resolver.resolveRequest;
const expoWidgetsStubPath = path.join(__dirname, 'bundle/layout-registry-stub.ts');
const asyncRequireStubPath = path.join(__dirname, 'bundle/async-require-stub.ts');
// const emptyModuleStubPath = path.join(__dirname, 'bundle/empty-module-stub.js');
const relativeFileSpecifierRe = /^\.\.?(?:$|[\\/])/;

// Metro also resolves its own absolute paths (e.g. the empty module) through `resolveRequest`.
// `path.win32.isAbsolute` covers POSIX paths as well as Windows drive letter (`D:\`) and UNC paths,
// which would otherwise be stubbed as empty modules and make Metro recurse until the stack overflows.
function isFileSpecifier(moduleName) {
  return path.win32.isAbsolute(moduleName) || relativeFileSpecifierRe.test(moduleName);
}

config.resolver = {
  ...config.resolver,
  resolveRequest(context, moduleName, platform) {
    if (isFileSpecifier(moduleName)) {
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
