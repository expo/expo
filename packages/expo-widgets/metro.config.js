const { getDefaultConfig } = require('expo/metro-config');
const resolve = require('metro-resolver').resolve;
const path = require('path');

const config = getDefaultConfig(__dirname);
const emptyModulePath = require.resolve('metro-runtime/src/modules/empty-module');
const expoStubPath = path.resolve(__dirname, './bundle/expo-module-stub.ts');
const reactStubPath = path.resolve(__dirname, './bundle/react-stub.ts');
const jsxRuntimeStubPath = path.resolve(__dirname, './bundle/jsx-runtime-stub.ts');

const buildConfig = {
  ...config,
  resolver: {
    ...config.resolver,
    resolveRequest(context, moduleName) {
      const resolvedPlatform = 'ios';
      if (moduleName === 'expo') {
        return { type: 'sourceFile', filePath: expoStubPath };
      }
      if (moduleName === 'react') {
        return { type: 'sourceFile', filePath: reactStubPath };
      }
      if (moduleName === 'react/jsx-runtime') {
        return { type: 'sourceFile', filePath: jsxRuntimeStubPath };
      }
      if (moduleName === 'react/jsx-dev-runtime') {
        return { type: 'sourceFile', filePath: jsxRuntimeStubPath };
      }

      if (
        moduleName.startsWith('@expo/ui') ||
        moduleName.startsWith('@babel/runtime') ||
        moduleName.startsWith('./') ||
        moduleName.startsWith('../') ||
        path.isAbsolute(moduleName)
      ) {
        return resolve(context, moduleName, resolvedPlatform);
      }

      return { type: 'sourceFile', filePath: emptyModulePath };
    },
  },
  transformer: {
    ...config.transformer,
    babelTransformerPath: require.resolve('@expo/metro-config/build/babel-transformer'),
    getTransformOptions: async () => ({
      transform: { experimentalImportSupport: false, inlineRequires: false },
    }),
  },
  serializer: {
    ...config.serializer,
    getPolyfills: () => [],
  },
};

module.exports = buildConfig;
