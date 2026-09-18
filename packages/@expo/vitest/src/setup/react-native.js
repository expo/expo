// @ts-check
/**
 * Vitest port of `@react-native/jest-preset/jest/setup.js`.
 *
 * Runs before each test file in the iOS and Android projects. Installs the React Native test
 * globals and the Node require hook that transforms React Native's Flow source and swaps the
 * native boundary for the mocks that ship with `@react-native/jest-preset`.
 */
import { createRequire } from 'node:module';
import path from 'node:path';
import { vi } from 'vitest';

import { ASSET_EXTENSIONS, getPlatformExtensions } from '../extensions.js';
import { createJestShim, installNodeRequireHook } from '../hooks/node-require-hook.js';

const platform = /** @type {'ios' | 'android'} */ (process.env.EXPO_VITEST_PLATFORM);
const projectRoot = process.env.EXPO_VITEST_PROJECT_ROOT ?? process.cwd();

if (platform !== 'ios' && platform !== 'android') {
  throw new Error(
    `@expo/vitest: the React Native setup file expects EXPO_VITEST_PLATFORM to be "ios" or "android", got "${platform}"`
  );
}

const projectRequire = createRequire(path.join(projectRoot, 'package.json'));

// React Native's mocks use `jest.fn` and `jest.requireActual`; the require hook prepends a
// `jest` binding built from this shim to each of those files.
globalThis.__EXPO_VITEST_JEST__ = createJestShim(vi);

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
// Suppress the `react-test-renderer` warnings until New Architecture and legacy mode are no
// longer supported by React Native.
globalThis.IS_REACT_NATIVE_TEST_ENVIRONMENT = true;

Object.defineProperties(globalThis, {
  __DEV__: { configurable: true, enumerable: true, value: true, writable: true },
  cancelAnimationFrame: {
    configurable: true,
    enumerable: true,
    /** @param {any} id */
    value(id) {
      return clearTimeout(id);
    },
    writable: true,
  },
  nativeFabricUIManager: { configurable: true, enumerable: true, value: {}, writable: true },
  performance: {
    configurable: true,
    enumerable: true,
    value: { now: vi.fn(Date.now) },
    writable: true,
  },
  requestAnimationFrame: {
    configurable: true,
    enumerable: true,
    /** @param {(time: number) => void} callback */
    value(callback) {
      return setTimeout(() => callback(Date.now()), 0);
    },
    writable: true,
  },
  window: { configurable: true, enumerable: true, value: globalThis, writable: true },
});

const rnJestPresetRoot = path.dirname(
  projectRequire.resolve('@react-native/jest-preset/package.json', {
    paths: [projectRoot, path.dirname(new URL(import.meta.url).pathname)],
  })
);
/** @param {string} name */
const rnMock = (name) => path.join(rnJestPresetRoot, 'jest', 'mocks', `${name}.js`);

// The same table as `@react-native/jest-preset/jest/setup.js`, expressed as require redirects.
const mocks = {
  'react-native/Libraries/AppState/AppState': rnMock('AppState'),
  'react-native/Libraries/BatchedBridge/NativeModules': rnMock('NativeModules'),
  'react-native/Libraries/Components/AccessibilityInfo/AccessibilityInfo':
    rnMock('AccessibilityInfo'),
  'react-native/Libraries/Components/ActivityIndicator/ActivityIndicator':
    rnMock('ActivityIndicator'),
  'react-native/Libraries/Components/Clipboard/Clipboard': rnMock('Clipboard'),
  'react-native/Libraries/Components/RefreshControl/RefreshControl': rnMock('RefreshControl'),
  'react-native/Libraries/Components/ScrollView/ScrollView': rnMock('ScrollView'),
  'react-native/Libraries/Components/TextInput/TextInput': rnMock('TextInput'),
  'react-native/Libraries/Components/View/View': rnMock('View'),
  'react-native/Libraries/Components/View/ViewNativeComponent': rnMock('ViewNativeComponent'),
  'react-native/Libraries/Core/InitializeCore': rnMock('InitializeCore'),
  'react-native/setup-env': rnMock('InitializeCore'),
  'react-native/Libraries/Image/Image': rnMock('Image'),
  'react-native/Libraries/Linking/Linking': rnMock('Linking'),
  'react-native/Libraries/Modal/Modal': rnMock('Modal'),
  'react-native/Libraries/NativeComponent/NativeComponentRegistry':
    rnMock('NativeComponentRegistry'),
  'react-native/Libraries/ReactNative/RendererProxy': rnMock('RendererProxy'),
  'react-native/Libraries/ReactNative/requireNativeComponent': rnMock('requireNativeComponent'),
  'react-native/Libraries/ReactNative/UIManager': rnMock('UIManager'),
  'react-native/Libraries/Text/Text': rnMock('Text'),
  'react-native/Libraries/Utilities/useColorScheme': rnMock('useColorScheme'),
  'react-native/Libraries/Vibration/Vibration': rnMock('Vibration'),
};

// Jest automocks this one (no factory). Provide the same shape with mock functions.
// The LogBox and asset registry stubs come from `jest-expo/src/preset/setup.js`; they live here
// because they must apply to React Native's own `require()` calls, which Node handles.
const virtualModules = {
  'react-native/Libraries/LogBox/LogBox': `
    module.exports = {
      __esModule: true,
      default: {
        ignoreLogs() {},
        ignoreAllLogs() {},
        install() {},
        uninstall() {},
      },
    };
  `,
  'react-native/asset-registry': `
    const jest = globalThis.__EXPO_VITEST_JEST__.forModule(module);
    module.exports = {
      __esModule: true,
      registerAsset: jest.fn(() => 1),
      getAssetByID: jest.fn(() => ({
        fileSystemLocation: '/full/path/to/directory',
        httpServerLocation: '/assets/full/path/to/directory',
        scales: [1],
        fileHashes: ['md5'],
        name: 'name',
        exists: true,
        type: 'type',
        hash: 'md5',
        uri: 'uri',
        width: 1,
        height: 1,
      })),
    };
  `,
  'react-native/Libraries/Core/NativeExceptionsManager': `
    const jest = globalThis.__EXPO_VITEST_JEST__.forModule(module);
    module.exports = {
      __esModule: true,
      default: {
        reportFatalException: jest.fn(),
        reportException: jest.fn(),
        reportSoftException: jest.fn(),
        updateExceptionMessage: jest.fn(),
        dismissRedbox: jest.fn(),
      },
    };
  `,
};

installNodeRequireHook({
  platform,
  platformExtensions: getPlatformExtensions(platform),
  projectRoot,
  mocks,
  virtualModules,
  assetExtensions: ASSET_EXTENSIONS,
});

// Installs `global.ErrorUtils`, which React Native expects to exist.
projectRequire('@react-native/js-polyfills/error-guard');
