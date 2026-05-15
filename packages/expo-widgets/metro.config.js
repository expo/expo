const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');
const { resolveWorkspaceRoot } = require('resolve-workspace-root');

const projectRoot = process.cwd();
const config = getDefaultConfig(projectRoot);

const expoStubPath = path.resolve(__dirname, './bundle/expo-stub.ts');
const expoModulesCoreStubPath = path.resolve(__dirname, './bundle/expo-modules-core-stub.ts');
const reactStubPath = path.resolve(__dirname, './bundle/react-stub.ts');
const reactNativeStubPath = path.resolve(__dirname, './bundle/react-native-stub.ts');
const jsxRuntimeStubPath = path.resolve(__dirname, './bundle/jsx-runtime-stub.ts');

// The `projectRoot` won't be included by default, since we alter it to be `__dirname`
// to bundle from `expo-widgets` as the main module
// NOTE: We check the `watchFolders` to start with `projectRoot`, since `expo/metro-config`
// might add folders if we're in a monorepo
const watchFolders = config.watchFolders;
if (!watchFolders.some((entry) => !entry.startsWith(projectRoot))) {
  watchFolders.push(projectRoot);
}
// If expo-widgets is outside the user's project (e.g., symlinked, in a different monorepo,
// or as an installed dependency), add its workspace root so Metro can resolve its dependencies.
const rel = path.relative(projectRoot, __dirname);
if (rel.startsWith('..') || path.isAbsolute(rel)) {
  const widgetWorkspaceRoot = resolveWorkspaceRoot(__dirname);
  if (widgetWorkspaceRoot && !watchFolders.includes(widgetWorkspaceRoot)) {
    watchFolders.push(widgetWorkspaceRoot);
  }
}

const buildConfig = {
  ...config,
  projectRoot: __dirname, // Override root to be expo-widgets
  watchFolders,
  resolver: {
    ...config.resolver,
    resolveRequest(context, moduleName, platform) {
      const fileSpecifierRe = /^[\\/]|^\.\.?(?:$|[\\/])/i;
      if (fileSpecifierRe.test(moduleName)) {
        return context.resolveRequest(context, moduleName, platform);
      }
      switch (moduleName) {
        case 'expo':
          return { type: 'sourceFile', filePath: expoStubPath };
        case 'expo-modules-core':
          return { type: 'sourceFile', filePath: expoModulesCoreStubPath };
        case 'react':
          return { type: 'sourceFile', filePath: reactStubPath };
        case 'react/jsx-runtime':
        case 'react/jsx-dev-runtime':
          return { type: 'sourceFile', filePath: jsxRuntimeStubPath };
        case 'react-native':
          return { type: 'sourceFile', filePath: reactNativeStubPath };
        case 'react-native-worklets':
        case 'react-native-reanimated':
          return { type: 'empty' };
        default:
          return context.resolveRequest(context, moduleName, platform);
      }
    },
  },
  transformer: {
    ...config.transformer,
    enableBabelRCLookup: false,
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
