#!/usr/bin/env node
/**
 * Generates the builtins manifest with package versions from the monorepo.
 *
 * Usage: node scripts/generate-builtins-manifest.js
 *
 * This script:
 * 1. Reads the BUILTINS array from src/start/server/metro/builtins.ts
 * 2. Resolves each package version from the monorepo
 * 3. Generates a manifest JSON file with names and versions
 */
const fs = require('fs');
const path = require('path');

const CLI_ROOT = path.join(__dirname, '..');
const MONOREPO_ROOT = path.join(CLI_ROOT, '../../..');
const MANIFEST_OUTPUT_PATH = path.join(CLI_ROOT, 'static/std-runtime.json');

/**
 * Modules that are pre-bundled into the Expo Go runtime.
 * Order matters for some modules (e.g., react must come before react-native).
 */
const BUILTINS = [
  // React ecosystem
  'react',
  'react/jsx-dev-runtime',
  'react/jsx-runtime',
  'react-is',
  'scheduler',
  'react-refresh/runtime',

  // React Native assets
  '@react-native/assets-registry/registry',
  '@react-native/normalize-colors',

  // React Native core
  'react-native',
  'react-native/Libraries/Core/InitializeCore',
  'react-native/Libraries/Utilities/HMRClient',
  'react-native/Libraries/Core/ExceptionsManager',
  'react-native/Libraries/LogBox/LogBox',
  'react-native/Libraries/NativeModules/specs/NativeRedBox',
  'react-native/Libraries/Utilities/DevSettings',
  'react-native/Libraries/Utilities/DevLoadingView',
  'react-native/Libraries/Core/NativeExceptionsManager',
  'react-native/src/private/setup/setUpDOM',
  'react-native/src/private/featureflags/ReactNativeFeatureFlags',
  'react-native/Libraries/NativeComponent/NativeComponentRegistry',
  'react-native/Libraries/Utilities/PolyfillFunctions',
  'react-native/Libraries/ReactPrivate/ReactNativePrivateInterface',
  'react-native/Libraries/Image/resolveAssetSource',
  'react-native/Libraries/StyleSheet/processColor',
  'react-native/Libraries/NativeComponent/ViewConfigIgnore',
  'react-native/Libraries/StyleSheet/processColorArray',
  'react-native/Libraries/NativeModules/specs/NativeSourceCode',
  'react-native/Libraries/Image/AssetSourceResolver',
  'react-native/Libraries/ReactPrivate/ReactNativePrivateInitializeCore',
  'react-native/Libraries/ReactNative/RendererProxy',
  'react-native/Libraries/Core/ReactNativeVersion',
  'react-native/Libraries/BatchedBridge/BatchedBridge',
  'react-native/Libraries/ReactNative/AppContainer',
  'react-native/Libraries/Utilities/dismissKeyboard',
  'react-native/Libraries/Renderer/shims/ReactNative',
  'react-native/Libraries/Components/UnimplementedViews/UnimplementedView',
  'react-native/Libraries/Components/TextInput/TextInputState',
  'react-native/Libraries/Core/Devtools/parseErrorStack',
  'react-native/Libraries/Core/Devtools/symbolicateStackTrace',
  'react-native/Libraries/Core/Devtools/getDevServer',
  'react-native/Libraries/Utilities/codegenNativeCommands',
  'react-native/Libraries/Utilities/codegenNativeComponent',

  // Core polyfills and utilities
  'url',
  'whatwg-fetch',
  'react-devtools-core',
  'base64-js',
  'buffer',
  'punycode',
  'whatwg-url-without-unicode',
  'pretty-format',
  'event-target-shim',
  'invariant',
  'regenerator-runtime/runtime',
  'anser',
  'stacktrace-parser',

  // Expo modules core
  'expo-modules-core',
  'expo-modules-core/types',
  'expo-modules-core/src/polyfill/dangerous-internal',
  'expo-modules-core/src/uuid',
  'expo-modules-core/src/LegacyEventEmitter',

  // Expo SDK
  'expo',
  'expo/fetch',
  'expo/dom',
  'expo/dom/global',
  'expo/internal/async-require-module',
  '@expo/metro-runtime/rsc/runtime',
  '@expo/metro-runtime',

  '@expo/log-box',
  '@expo/log-box/lib',
  '@expo/log-box/src/LogBox',
  'escape-string-regexp',

  'expo-file-system',
  'expo-file-system/next',
  'expo-file-system/legacy',
  'expo-asset',
  'expo-constants',
  'expo-keep-awake',
  'expo-status-bar',
  'expo-blur',
  'expo-font',
  'expo-haptics',
  'expo-image',
  'expo-linking',
  'expo-splash-screen',
  'expo-symbols',
  'expo-system-ui',
  'expo-web-browser',

  // React Native ecosystem
  'react-native-gesture-handler',
  'react-native-reanimated',
  'react-native-safe-area-context',
  'react-native-screens',
  'react-native-webview',
  'react-native-is-edge-to-edge',
  '@react-native-masked-view/masked-view',

  // Navigation
  '@react-navigation/routers',
  '@react-navigation/core',
  '@react-navigation/native',
  '@react-navigation/elements',
  '@react-navigation/native-stack',
  '@react-navigation/bottom-tabs',

  // Utilities
  'color',
  'color-string',
  'color-name',
  '@radix-ui/react-compose-refs',
  '@radix-ui/react-slot',
  'nanoid/non-secure',
  'use-latest-callback',
  'query-string',
  'use-sync-external-store',
  'use-sync-external-store/with-selector',
];

/**
 * Get the base package name from a module specifier.
 */
function getPackageName(moduleSpecifier) {
  if (moduleSpecifier.startsWith('@')) {
    const parts = moduleSpecifier.split('/');
    return parts.slice(0, 2).join('/');
  }
  return moduleSpecifier.split('/')[0];
}

/**
 * Try to resolve a package version from multiple locations in the monorepo.
 */
function resolvePackageVersion(packageName) {
  // Locations to check for package.json
  const locations = [
    // Check apps/builtins/node_modules first (the source of truth for builtins bundle)
    path.join(MONOREPO_ROOT, 'apps/builtins/node_modules', packageName, 'package.json'),
    // Check monorepo packages (for expo packages)
    path.join(MONOREPO_ROOT, 'packages', packageName, 'package.json'),
    // Check scoped monorepo packages
    path.join(MONOREPO_ROOT, 'packages', packageName.replace('@expo/', '@expo/'), 'package.json'),
    // Check root node_modules
    path.join(MONOREPO_ROOT, 'node_modules', packageName, 'package.json'),
  ];

  for (const location of locations) {
    try {
      if (fs.existsSync(location)) {
        const pkg = JSON.parse(fs.readFileSync(location, 'utf-8'));
        return pkg.version;
      }
    } catch (e) {
      // Continue to next location
    }
  }

  return null;
}

/**
 * Main function to generate the manifest.
 */
function generateManifest() {
  console.log('Generating builtins manifest...\n');

  console.log(`Found ${BUILTINS.length} builtin modules\n`);

  // Get unique packages and their versions
  const packages = new Map();
  const modulesByPackage = new Map();

  for (const module of BUILTINS) {
    const packageName = getPackageName(module);

    if (!modulesByPackage.has(packageName)) {
      modulesByPackage.set(packageName, []);
    }
    modulesByPackage.get(packageName).push(module);

    if (!packages.has(packageName)) {
      const version = resolvePackageVersion(packageName);
      packages.set(packageName, version);

      if (version) {
        console.log(`  ${packageName}: ${version}`);
      } else {
        console.warn(`  ${packageName}: VERSION NOT FOUND`);
      }
    }
  }

  // Build the manifest
  const manifest = {
    version: '1.0.0',
    generatedAt: new Date().toISOString(),
    modules: BUILTINS,
    packages: Object.fromEntries(
      Array.from(packages.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([name, version]) => [name, { version, modules: modulesByPackage.get(name) }])
    ),
  };

  // Write the manifest
  fs.writeFileSync(MANIFEST_OUTPUT_PATH, JSON.stringify(manifest, null, 2) + '\n');

  console.log(`\nManifest written to: ${MANIFEST_OUTPUT_PATH}`);
  console.log(`Total packages: ${packages.size}`);
  console.log(`Total modules: ${BUILTINS.length}`);
}

generateManifest();
