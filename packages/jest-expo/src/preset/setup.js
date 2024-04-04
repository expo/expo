/**
 * Adds Expo-related mocks to the Jest environment. Jest runs this setup module after it runs the
 * React Native setup module.
 */
'use strict';

const findUp = require('find-up');
const path = require('path');
const mockNativeModules = require('react-native/Libraries/BatchedBridge/NativeModules');
const stackTrace = require('stacktrace-js');

const publicExpoModules = require('./expoModules');
const internalExpoModules = require('./internalExpoModules');

// window isn't defined as of react-native 0.45+ it seems
if (typeof window !== 'object') {
  globalThis.window = global;
  globalThis.window.navigator = {};
}

if (typeof globalThis.__REACT_DEVTOOLS_GLOBAL_HOOK__ === 'undefined') {
  // RN 0.74 checks for the __REACT_DEVTOOLS_GLOBAL_HOOK__ on startup if getInspectorDataForViewAtPoint is used
  // React Navigation uses getInspectorDataForViewAtPoint() for improved log box integration in non-production builds
  globalThis.__REACT_DEVTOOLS_GLOBAL_HOOK__ = {
    isDisabled: true, // Used by `react-test-renderer` https://github.com/facebook/react/blob/113ab9af08c46e8a548a397154f5c9dfeb96ab6a/packages/react-reconciler/src/ReactFiberDevToolsHook.js#L60
    renderers: {
      // https://github.com/facebook/react-native/blob/fbbb4246707d85b692c006e0cb3b186a7c9068bc/packages/react-native/Libraries/Inspector/getInspectorDataForViewAtPoint.js#L40
      values: () => [],
    },
    on() {}, // https://github.com/facebook/react-native/blob/fbbb4246707d85b692c006e0cb3b186a7c9068bc/packages/react-native/Libraries/Inspector/getInspectorDataForViewAtPoint.js#L45
    off() {},
  };
  // React is inconsistent with how it checks for the global hook
  globalThis.window.__REACT_DEVTOOLS_GLOBAL_HOOK__ = globalThis.__REACT_DEVTOOLS_GLOBAL_HOOK__;
}

const mockImageLoader = {
  configurable: true,
  enumerable: true,
  get: () => ({
    prefetchImage: jest.fn(),
    getSize: jest.fn((uri, success) => process.nextTick(() => success(320, 240))),
  }),
};
Object.defineProperty(mockNativeModules, 'ImageLoader', mockImageLoader);
Object.defineProperty(mockNativeModules, 'ImageViewManager', mockImageLoader);

Object.defineProperty(mockNativeModules, 'LinkingManager', {
  configurable: true,
  enumerable: true,
  get: () => mockNativeModules.Linking,
});

const expoModules = {
  ...publicExpoModules,
  ...internalExpoModules,
};

// Mock the experience URL in development mode for asset setup
expoModules.NativeUnimoduleProxy.modulesConstants.mockDefinition.ExponentConstants.experienceUrl.mock =
  'exp://192.168.1.200:8081';

function mock(property, customMock) {
  const propertyType = property.type;
  let mockValue;
  if (customMock !== undefined) {
    mockValue = customMock;
  } else if (propertyType === 'function') {
    if (property.functionType === 'promise') {
      mockValue = jest.fn(() => Promise.resolve());
    } else {
      mockValue = jest.fn();
    }
  } else if (propertyType === 'number') {
    mockValue = 1;
  } else if (propertyType === 'string') {
    mockValue = 'mock';
  } else if (propertyType === 'array') {
    mockValue = [];
  } else if (propertyType === 'mock') {
    mockValue = mockByMockDefinition(property.mockDefinition);
  } else {
    mockValue = {};
  }
  return mockValue;
}

function mockProperties(moduleProperties, customMocks) {
  const mockedProperties = {};
  for (const propertyName of Object.keys(moduleProperties)) {
    const property = moduleProperties[propertyName];
    const customMock =
      customMocks && customMocks.hasOwnProperty(propertyName)
        ? customMocks[propertyName]
        : property.mock;
    mockedProperties[propertyName] = mock(property, customMock);
  }
  return mockedProperties;
}

function mockByMockDefinition(definition) {
  const mock = {};
  for (const key of Object.keys(definition)) {
    mock[key] = mockProperties(definition[key]);
  }
  return mock;
}

for (const moduleName of Object.keys(expoModules)) {
  const moduleProperties = expoModules[moduleName];
  const mockedProperties = mockProperties(moduleProperties);

  Object.defineProperty(mockNativeModules, moduleName, {
    configurable: true,
    enumerable: true,
    get: () => mockedProperties,
  });
}

Object.keys(mockNativeModules.NativeUnimoduleProxy.viewManagersMetadata).forEach(
  (viewManagerName) => {
    Object.defineProperty(mockNativeModules.UIManager, `ViewManagerAdapter_${viewManagerName}`, {
      get: () => ({
        NativeProps: {},
        directEventTypes: [],
      }),
    });
  }
);

try {
  jest.mock('expo-file-system', () => ({
    downloadAsync: jest.fn(() => Promise.resolve({ md5: 'md5', uri: 'uri' })),
    getInfoAsync: jest.fn(() => Promise.resolve({ exists: true, md5: 'md5', uri: 'uri' })),
    readAsStringAsync: jest.fn(() => Promise.resolve()),
    writeAsStringAsync: jest.fn(() => Promise.resolve()),
    deleteAsync: jest.fn(() => Promise.resolve()),
    moveAsync: jest.fn(() => Promise.resolve()),
    copyAsync: jest.fn(() => Promise.resolve()),
    makeDirectoryAsync: jest.fn(() => Promise.resolve()),
    readDirectoryAsync: jest.fn(() => Promise.resolve()),
    createDownloadResumable: jest.fn(() => Promise.resolve()),
  }));
} catch (error) {
  // Allow this module to be optional for bare-workflow
  if (error.code !== 'MODULE_NOT_FOUND') {
    throw error;
  }
}

jest.mock('@react-native/assets-registry/registry', () => ({
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
}));

jest.doMock('react-native/Libraries/BatchedBridge/NativeModules', () => mockNativeModules);

jest.doMock('react-native/Libraries/LogBox/LogBox', () => ({
  ignoreLogs: (patterns) => {
    // Do nothing.
  },
  ignoreAllLogs: (value) => {
    // Do nothing.
  },
  install: () => {
    // Do nothing.
  },
  uninstall: () => {
    // Do nothing.
  },
}));

// Mock the `createSnapshotFriendlyRef` to return an ref that can be serialized in snapshots.
jest.doMock('expo-modules-core/build/Refs', () => ({
  createSnapshotFriendlyRef: () => {
    const { createSnapshotFriendlyRef } = jest.requireActual('expo-modules-core/build/Refs');
    // Fixes: `cannot define property "toJSON", object is not extensible
    const ref = Object.create(createSnapshotFriendlyRef());
    Object.defineProperty(ref, 'toJSON', {
      value: () => '[React.ref]',
    });
    return ref;
  },
}));

function attemptLookup(moduleName) {
  // hack to get the package name from the module name
  const filePath = stackTrace.getSync().find((line) => line.fileName.includes(moduleName));
  if (!filePath) {
    return null;
  }
  const modulePath = findUp.sync('package.json', { cwd: filePath.fileName });
  const moduleMockPath = path.join(modulePath, '..', 'mocks', moduleName);

  try {
    const mockedPackageNativeModule = jest.requireActual(moduleMockPath);
    return mockedPackageNativeModule;
  } catch {
    return null;
  }
}

try {
  jest.doMock('expo-modules-core', () => {
    const ExpoModulesCore = jest.requireActual('expo-modules-core');
    const uuid = jest.requireActual('expo-modules-core/build/uuid/uuid.web');

    // support old hard-coded mocks TODO: remove this
    const { NativeModulesProxy } = ExpoModulesCore;

    // Mock the `uuid` object with the implementation for web.
    ExpoModulesCore.uuid.v4 = uuid.default.v4;
    ExpoModulesCore.uuid.v5 = uuid.default.v5;

    // After the NativeModules mock is set up, we can mock NativeModuleProxy's functions that call
    // into the native proxy module. We're not really interested in checking whether the underlying
    // method is called, just that the proxy method is called, since we have unit tests for the
    // adapter and believe it works correctly.
    //
    // NOTE: The adapter validates the number of arguments, which we don't do in the mocked functions.
    // This means the mock functions will not throw validation errors the way they would in an app.

    for (const moduleName of Object.keys(NativeModulesProxy)) {
      const nativeModule = NativeModulesProxy[moduleName];
      for (const propertyName of Object.keys(nativeModule)) {
        if (typeof nativeModule[propertyName] === 'function') {
          nativeModule[propertyName] = jest.fn(async () => {});
        }
      }
    }
    return {
      ...ExpoModulesCore,
      // Mock EventEmitter since it's commonly constructed in modules and causing warnings.
      EventEmitter: jest.fn().mockImplementation(() => {
        const fbemitter = require('fbemitter');
        const emitter = new fbemitter.EventEmitter();
        return {
          addListener: jest.fn().mockImplementation((...args) => {
            const subscription = emitter.addListener(...args);
            subscription.__remove = subscription.remove;
            return subscription;
          }),
          removeAllListeners: jest.fn().mockImplementation((...args) => {
            emitter.removeAllListeners(...args);
          }),
          removeSubscription: jest.fn().mockImplementation((subscription) => {
            // expo-sensor will override the `subscription.remove()` method,
            // to prevent it from recursive call. we need to call the original remove method.
            if (typeof subscription.__remove === 'function') {
              subscription.__remove();
            }
          }),
          emit: jest.fn().mockImplementation((...args) => {
            emitter.emit(...args);
          }),
        };
      }),
      requireNativeModule: (name) => {
        // Support auto-mocking of expo-modules that:
        // 1. have a mock in the `mocks` directory
        // 2. the native module (e.g. ExpoCrypto) name matches the package name (expo-crypto)
        const nativeModuleMock = attemptLookup(name);
        if (!nativeModuleMock) {
          return ExpoModulesCore.requireNativeModule(name);
        }
        return Object.fromEntries(
          Object.entries(nativeModuleMock).map(([k, v]) => {
            if (typeof v === 'function') {
              return [k, jest.fn(v)];
            }
            return [k, v];
          })
        );
      },
    };
  });
} catch (error) {
  // Allow this module to be optional for bare-workflow
  if (error.code !== 'MODULE_NOT_FOUND') {
    throw error;
  }
}

// Installs web implementations of global things that are normally installed through JSI.
require('expo-modules-core/build/web/index.web');

// Ensure the environment globals are installed before the first test runs.
require('expo/build/winter');
