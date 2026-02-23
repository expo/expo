const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);
const expoStubPath = path.resolve(__dirname, './bundle/expo-module-stub.ts');
const reactStubPath = path.resolve(__dirname, './bundle/react-stub.ts');
const jsxRuntimeStubPath = path.resolve(__dirname, './bundle/jsx-runtime-stub.ts');

const buildConfig = {
  ...config,
  resolver: {
    ...config.resolver,
    resolveRequest(context, moduleName, platform) {
      if (moduleName === 'expo') {
        return { type: 'sourceFile', filePath: expoStubPath };
      } else if (moduleName === 'react') {
        return { type: 'sourceFile', filePath: reactStubPath };
      } else if (moduleName === 'react/jsx-runtime') {
        return { type: 'sourceFile', filePath: jsxRuntimeStubPath };
      } else if (moduleName === 'react/jsx-dev-runtime') {
        return { type: 'sourceFile', filePath: jsxRuntimeStubPath };
      } else {
        return context.resolveRequest(context, moduleName, platform);
      }
    },
  },
  transformer: {
    ...config.transformer,
    getTransformOptions: async () => ({
      transform: {
        experimentalImportSupport: true,
        inlineRequires: false,
      },
    }),
  },
  serializer: {
    ...config.serializer,
    getPolyfills: () => [],
  },
};

module.exports = buildConfig;
