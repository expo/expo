/**
 * Adds Expo-related mocks to the Jest environment. Jest runs this setup module after it runs the
 * React Native setup module.
 */
'use strict';

const mockNativeModules = require('react-native/Libraries/BatchedBridge/NativeModules');

const createMockConstants = require('./createMockConstants');
const publicExpoModules = require('./expoModules');
const internalExpoModules = require('./internalExpoModules');

// window isn't defined as of react-native 0.45+ it seems
if (typeof window !== 'object') {
  global.window = global;
  global.window.navigator = {};
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

mockNativeModules.NativeUnimoduleProxy.viewManagersNames.forEach(viewManagerName => {
  Object.defineProperty(mockNativeModules.UIManager, `ViewManagerAdapter_${viewManagerName}`, {
    get: () => ({
      NativeProps: {},
      directEventTypes: [],
    }),
  });
});

const modulesConstants = mockNativeModules.NativeUnimoduleProxy.modulesConstants;
mockNativeModules.NativeUnimoduleProxy.modulesConstants = {
  ...modulesConstants,
  ExponentConstants: {
    ...modulesConstants.ExponentConstants,
    ...createMockConstants(),
  },
};

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

jest.mock('react-native/Libraries/Image/AssetRegistry', () => ({
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
  ignoreLogs: patterns => {
    // Do nothing.
  },
  ignoreAllLogs: value => {
    // Do nothing.
  },
  install: () => {
    // Do nothing.
  },
  uninstall: () => {
    // Do nothing.
  },
}));

try {
  jest.mock('@unimodules/react-native-adapter', () => {
    const ReactNativeAdapter = jest.requireActual('@unimodules/react-native-adapter');
    const { NativeModulesProxy } = ReactNativeAdapter;

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

    return ReactNativeAdapter;
  });
} catch (error) {
  // Allow this module to be optional for bare-workflow
  if (error.code !== 'MODULE_NOT_FOUND') {
    throw error;
  }
}
