/* eslint-env node */
// Learn more https://docs.expo.dev/guides/customizing-metro/
const { getDefaultConfig } = require('expo/metro-config');
const fs = require('node:fs');
const path = require('node:path');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);
const monorepoRoot = path.join(__dirname, '../..');

config.resolver.assetExts.push(
  'kml', // See: ../native-component-list/assets/expo-maps/sample_kml.kml
  'wasm' // For expo-sqlite on web
);

// Minimize the "watched" folders that Metro crawls through to speed up Metro in big monorepos.
// Note, omitting folders disables Metro from resolving files within these folders
// This also happens when symlinks falls within these folders, but the real location doesn't.
config.watchFolders = [
  __dirname, // Allow Metro to resolve all files within this project
  path.join(monorepoRoot, 'packages'), // Allow Metro to resolve all workspace files of the monorepo
  path.join(monorepoRoot, 'node_modules'), // Allow Metro to resolve "shared" `node_modules` of the monorepo
  path.join(monorepoRoot, 'apps/common'), // Allow Metro to resolve common ThemeProvider
  path.join(monorepoRoot, 'apps/native-component-list'), // Workaround for Yarn v1 workspace issue where workspace dependencies aren't properly linked, should be at `<root>/node_modules/apps/native-component-list`
  path.join(monorepoRoot, 'apps/test-suite'), // Workaround for Yarn v1 workspace issue where workspace dependencies aren't properly linked, should be at `<root>/node_modules/apps/test-suite`
];

function findUpTSConfig(cwd) {
  const tsconfigPath = path.resolve(cwd, './tsconfig.json');
  if (fs.existsSync(tsconfigPath)) {
    return path.dirname(tsconfigPath);
  }

  const parent = path.dirname(cwd);
  if (parent === cwd) return null;

  return findUpTSConfig(parent);
}

function findUpTSProjectRootOrAssert(dir) {
  const tsProjectRoot = findUpTSConfig(dir);
  if (!tsProjectRoot) {
    throw new Error('Local modules watched dir needs to be inside a TS project with tsconfig.json');
  }
  return tsProjectRoot;
}

// When testing on MacOS we need to swap out `react-native` for `react-native-macos`
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (
    platform === 'macos' &&
    (moduleName === 'react-native' || moduleName.startsWith('react-native/'))
  ) {
    const newModuleName = moduleName.replace('react-native', 'react-native-macos');
    return context.resolveRequest(context, newModuleName, platform);
  }

  const localModulesModulesPath = path.resolve(__dirname, './.expo/localModules/modules');

  let localModuleFileExtension = null;
  if (moduleName.endsWith('.module')) {
    localModuleFileExtension = '.module.js';
  } else if (moduleName.endsWith('.view')) {
    localModuleFileExtension = '.view.js';
  }
  if (localModuleFileExtension) {
    const tsProjectRoot = findUpTSProjectRootOrAssert(path.dirname(context.originModulePath));
    const relativePathToOriginModule = path.relative(
      tsProjectRoot,
      fs.realpathSync(path.dirname(context.originModulePath))
    );

    const modulePath = path.resolve(
      localModulesModulesPath,
      relativePathToOriginModule,
      moduleName.substring(0, moduleName.lastIndexOf('.')) + localModuleFileExtension
    );

    return {
      filePath: modulePath,
      type: 'sourceFile',
    };
  }

  const resolution = context.resolveRequest(context, moduleName, platform);
  return resolution;
};
// writing a screenshot otherwise shows a metro refresh banner at the top of the screen which can interfere with another screenshot
config.resolver.blockList.push(/.*bare-expo\/e2e.*/);

// When testing on MacOS we need to include the `react-native-macos/Libraries/Core/InitializeCore` as prepended global module
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

// `expo-sqlite` uses `SharedArrayBuffer` on web, which requires explicit COOP and COEP headers
// See: https://github.com/expo/expo/pull/35208
config.server.enhanceMiddleware = (middleware) => {
  return (req, res, next) => {
    res.setHeader('Cross-Origin-Embedder-Policy', 'credentialless');
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
    middleware(req, res, next);
  };
};

// Disable Babel's RC lookup, reducing the config loading in Babel - resulting in faster bootup for transformations
config.transformer.enableBabelRCLookup = false;

module.exports = config;
