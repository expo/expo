/**
 * Adds Expo-related mocks to the Jest environment. Jest runs this setup module
 * after it runs the React Native setup module.
 */
'use strict';

const { Response, Request, Headers, fetch } = require('whatwg-fetch');
global.Response = Response;
global.Request = Request;
global.Headers = Headers;
global.fetch = fetch;

const mockNativeModules = require('react-native/Libraries/BatchedBridge/NativeModules');

const createMockConstants = require('./createMockConstants');

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

const expoModules = require('./expoModules');

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
  for (let propertyName of Object.keys(moduleProperties)) {
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

for (let moduleName of Object.keys(expoModules)) {
  const moduleProperties = expoModules[moduleName];
  const mockedProperties = mockProperties(moduleProperties);

  Object.defineProperty(mockNativeModules, moduleName, {
    configurable: true,
    enumerable: true,
    get: () => mockedProperties,
  });
}

mockNativeModules.ExpoNativeModuleProxy.viewManagersNames.forEach(viewManagerName => {
  Object.defineProperty(mockNativeModules.UIManager, `ViewManagerAdapter_${viewManagerName}`, {
    get: () => ({
      NativeProps: {},
      directEventTypes: [],
    }),
  });
});

const modulesConstants = mockNativeModules.ExpoNativeModuleProxy.modulesConstants;

Object.defineProperty(mockNativeModules.ExpoNativeModuleProxy, 'modulesConstants', {
  get: () => ({
    ...modulesConstants,
    ExponentConstants: {
      ...modulesConstants.ExponentConstants,
      ...createMockConstants(),
    },
  }),
});

jest.mock('expo-file-system', () => ({
  FileSystem: {
    downloadAsync: jest.fn(() => Promise.resolve({ md5: 'md5', uri: 'uri' })),
    getInfoAsync: jest.fn(() => Promise.resolve({ exists: true, md5: 'md5', uri: 'uri' })),
    readAsStringAsync: jest.fn(),
    writeAsStringAsync: jest.fn(),
    deleteAsync: jest.fn(),
    moveAsync: jest.fn(),
    copyAsync: jest.fn(),
    makeDirectoryAsync: jest.fn(),
    readDirectoryAsync: jest.fn(),
    createDownloadResumable: jest.fn(),
  },
}));

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

// After NativeModules mock is set up we can mock NativeModulesProxy's functions that should call
// native side by proxy. We're not really interested in checking whether the underlying method
// is called, just that the proxy method is called (we believe the adapter is working properly).

const ExpoReactNativeAdapter = require('expo-react-native-adapter'); // eslint-disable-line import/order

const NativeModulesProxy = ExpoReactNativeAdapter.NativeModulesProxy;

for (let moduleName of Object.keys(NativeModulesProxy)) {
  for (let propName of Object.keys(NativeModulesProxy[moduleName])) {
    if (NativeModulesProxy[moduleName][propName] instanceof Function) {
      NativeModulesProxy[moduleName][propName] = jest.fn(() => new Promise(resolve => resolve()));
    }
  }
}

jest.doMock('expo-react-native-adapter', () => ({
  ...ExpoReactNativeAdapter,
  NativeModulesProxy,
}));
