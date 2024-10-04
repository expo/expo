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

// Ensure the environment globals are installed before the first test runs.
require('expo/build/winter');
