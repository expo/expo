// Learn more https://docs.expo.dev/guides/customizing-metro/
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const monorepoRoot = path.join(__dirname, '../..');
const config = getDefaultConfig(__dirname);

config.resolver.assetExts.push(
  'kml', // See: ../native-component-list/assets/expo-maps/sample_kml.kml
  'wasm', // For expo-sqlite on web
);

config.resolver.blockList = [
  // Exclude react-native-lab from haste map.
  // Because react-native versions may be different between node_modules/react-native and react-native-lab,
  // we should use the one from node_modules for bare-expo.
  /\breact-native-lab\b/,

  // Copied from expo-yarn-workspaces
  /\/__tests__\//,
  /\/android\/React(Android|Common)\//,
];

// Minimize the "watched" folders that Metro crawls through to speed up Metro in big monorepos.
// Note, omitting folders disables Metro from resolving files within these folders
// This also happens when symlinks falls within these folders, but the real location doesn't.
config.watchFolders = [
  __dirname, // Allow Metro to resolve all files within this project
  path.join(monorepoRoot, 'apps/native-component-list'), // Allow Metro to resolve all files within NCL
  path.join(monorepoRoot, 'apps/test-suite'), // Allow Metro to resolve all files within test-suite
  path.join(monorepoRoot, 'apps/common'), // Allow Metro to resolve common ThemeProvider
  path.join(monorepoRoot, 'packages'), // Allow Metro to resolve all workspace files of the monorepo
  path.join(monorepoRoot, 'node_modules'), // Allow Metro to resolve "shared" `node_modules` of the monorepo
];

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (
    platform === 'macos' &&
    (moduleName === 'react-native' || moduleName.startsWith('react-native/'))
  ) {
    const newModuleName = moduleName.replace('react-native', 'react-native-macos');
    return context.resolveRequest(context, newModuleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

const originalGetModulesRunBeforeMainModule = config.serializer.getModulesRunBeforeMainModule;
config.serializer.getModulesRunBeforeMainModule = () => {
  try {
    return [
      require.resolve('react-native/Libraries/Core/InitializeCore'),
      require.resolve('react-native-macos/Libraries/Core/InitializeCore'),
    ];
  } catch {}
  return originalGetModulesRunBeforeMainModule();
};

config.server.enhanceMiddleware = (middleware) => {
  return (req, res, next) => {
    res.setHeader('Cross-Origin-Embedder-Policy', 'credentialless');
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
    middleware(req, res, next);
  };
};

module.exports = config;
