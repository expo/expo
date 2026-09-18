// @ts-check
/**
 * Vitest port of `jest-expo/src/preset/setup.js`.
 *
 * Runs after `./react-native.js` in the iOS and Android projects. Installs the Expo module mocks
 * generated from the native module registry (see `jest-expo/src/preset/moduleMocks`) onto React
 * Native's mocked `NativeModules`, and replaces `expo-modules-core` so `requireNativeModule`
 * returns those mocks.
 */
import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { vi } from 'vitest';

const projectRoot = process.env.EXPO_VITEST_PROJECT_ROOT ?? process.cwd();
const projectRequire = createRequire(path.join(projectRoot, 'package.json'));
const ownRequire = createRequire(import.meta.url);

const global = /** @type {any} */ (globalThis);

// window isn't defined as of react-native 0.45+ it seems
if (typeof global.window !== 'object') {
  global.window = global;
  global.window.navigator = {};
}

if (typeof global.__REACT_DEVTOOLS_GLOBAL_HOOK__ === 'undefined') {
  // RN 0.74 checks for the __REACT_DEVTOOLS_GLOBAL_HOOK__ on startup if
  // getInspectorDataForViewAtPoint is used. React Navigation uses it for LogBox integration.
  global.__REACT_DEVTOOLS_GLOBAL_HOOK__ = {
    isDisabled: true,
    renderers: { values: () => [] },
    on() {},
    off() {},
  };
  global.window.__REACT_DEVTOOLS_GLOBAL_HOOK__ = global.__REACT_DEVTOOLS_GLOBAL_HOOK__;
}

// --- Native module mocks generated from the module registry ---------------------------------

const publicExpoModules = ownRequire('jest-expo/src/preset/moduleMocks/expoModules.js');
const internalExpoModules = ownRequire('jest-expo/src/preset/moduleMocks/internalExpoModules.js');
const thirdPartyModules = ownRequire('jest-expo/src/preset/moduleMocks/thirdPartyModules.js');

/**
 * Deep merge of plain objects (subset of `lodash/merge` used by jest-expo).
 * @param {any} target
 * @param {any} source
 */
function merge(target, source) {
  for (const key of Object.keys(source)) {
    const value = source[key];
    if (
      value &&
      typeof value === 'object' &&
      !Array.isArray(value) &&
      target[key] &&
      typeof target[key] === 'object' &&
      !Array.isArray(target[key])
    ) {
      merge(target[key], value);
    } else {
      target[key] = value;
    }
  }
  return target;
}

const expoModules = merge(
  structuredClone(publicExpoModules),
  merge(structuredClone(thirdPartyModules), structuredClone(internalExpoModules))
);

// Resolves to React Native's own `mocks/NativeModules.js` through the require hook.
const mockNativeModules = projectRequire(
  'react-native/Libraries/BatchedBridge/NativeModules'
).default;

const mockImageLoader = {
  configurable: true,
  enumerable: true,
  get: () => ({
    prefetchImage: vi.fn(),
    getSize: vi.fn((uri, success) => process.nextTick(() => success(320, 240))),
  }),
};
Object.defineProperty(mockNativeModules, 'ImageLoader', mockImageLoader);
Object.defineProperty(mockNativeModules, 'ImageViewManager', mockImageLoader);
Object.defineProperty(mockNativeModules, 'LinkingManager', {
  configurable: true,
  enumerable: true,
  get: () => mockNativeModules.Linking,
});

/**
 * @param {{ type: string, functionType?: string, mockDefinition?: any }} property
 * @param {unknown} customMock
 */
function mock(property, customMock) {
  if (customMock !== undefined) {
    return customMock;
  }
  switch (property.type) {
    case 'function':
      return property.functionType === 'promise' ? vi.fn(() => Promise.resolve()) : vi.fn();
    case 'number':
      return 1;
    case 'string':
      return 'mock';
    case 'array':
      return [];
    case 'mock':
      return mockByMockDefinition(property.mockDefinition);
    default:
      return {};
  }
}

/**
 * @param {Record<string, any>} moduleProperties
 * @param {Record<string, unknown>} [customMocks]
 */
function mockProperties(moduleProperties, customMocks) {
  /** @type {Record<string, unknown>} */
  const mockedProperties = {};
  for (const propertyName of Object.keys(moduleProperties)) {
    const property = moduleProperties[propertyName];
    const customMock =
      customMocks && Object.hasOwn(customMocks, propertyName)
        ? customMocks[propertyName]
        : property.mock;
    mockedProperties[propertyName] = mock(property, customMock);
  }
  return mockedProperties;
}

/** @param {Record<string, any>} definition */
function mockByMockDefinition(definition) {
  /** @type {Record<string, unknown>} */
  const result = {};
  for (const key of Object.keys(definition)) {
    result[key] = mockProperties(definition[key]);
  }
  return result;
}

for (const moduleName of Object.keys(expoModules)) {
  const mockedProperties = mockProperties(expoModules[moduleName]);
  Object.defineProperty(mockNativeModules, moduleName, {
    configurable: true,
    enumerable: true,
    get: () => mockedProperties,
  });
}

Object.keys(mockNativeModules.NativeUnimoduleProxy.viewManagersMetadata).forEach(
  (viewManagerName) => {
    Object.defineProperty(mockNativeModules.UIManager, `ViewManagerAdapter_${viewManagerName}`, {
      get: () => ({ NativeProps: {}, directEventTypes: [] }),
    });
  }
);

// --- Module mocks for code that Vite inlines --------------------------------------------------

// Expo's default async require messaging sockets expect a running dev server.
vi.mock('expo/src/async-require/messageSocket', () => ({ default: undefined }));

vi.mock('expo-file-system/legacy', () => ({
  downloadAsync: vi.fn(() => Promise.resolve({ md5: 'md5', uri: 'uri' })),
  getInfoAsync: vi.fn(() => Promise.resolve({ exists: true, md5: 'md5', uri: 'uri' })),
  readAsStringAsync: vi.fn(() => Promise.resolve()),
  writeAsStringAsync: vi.fn(() => Promise.resolve()),
  deleteAsync: vi.fn(() => Promise.resolve()),
  moveAsync: vi.fn(() => Promise.resolve()),
  copyAsync: vi.fn(() => Promise.resolve()),
  makeDirectoryAsync: vi.fn(() => Promise.resolve()),
  readDirectoryAsync: vi.fn(() => Promise.resolve()),
  createDownloadResumable: vi.fn(() => Promise.resolve()),
}));

vi.mock('react-native/asset-registry', () => ({
  registerAsset: vi.fn(() => 1),
  getAssetByID: vi.fn(() => ({
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

vi.mock('expo/src/winter/FormData', () => ({
  // The `installFormDataPatch` function is for native runtime only.
  installFormDataPatch: vi.fn(),
}));

// --- `mocks/<NativeModule>.ts` auto-discovery -------------------------------------------------

/**
 * jest-expo finds a package's `mocks/<ModuleName>.ts` by inspecting the call stack of
 * `requireNativeModule`. Under Vite the stack points at transformed modules, so instead index
 * every `mocks/` directory of the workspace (and the project) once, keyed by module name.
 * @returns {Map<string, string>}
 */
function indexNativeModuleMocks() {
  /** @type {Map<string, string>} */
  const index = new Map();
  /** @param {string} dir */
  const addMocksDir = (dir) => {
    let entries;
    try {
      entries = fs.readdirSync(dir);
    } catch {
      return;
    }
    for (const entry of entries) {
      const name = /^(.+)\.(ts|js|cjs|mjs)$/.exec(entry)?.[1];
      if (name && !index.has(name)) {
        index.set(name, path.join(dir, entry));
      }
    }
  };

  addMocksDir(path.join(projectRoot, 'mocks'));

  // Walk up to the workspace root, if any, and index `packages/*/mocks` and `packages/@expo/*/mocks`.
  for (let dir = projectRoot; path.dirname(dir) !== dir; dir = path.dirname(dir)) {
    if (fs.existsSync(path.join(dir, 'pnpm-workspace.yaml'))) {
      const packagesDir = path.join(dir, 'packages');
      for (const scopeOrPackage of safeReaddir(packagesDir)) {
        if (scopeOrPackage.startsWith('@')) {
          for (const pkg of safeReaddir(path.join(packagesDir, scopeOrPackage))) {
            addMocksDir(path.join(packagesDir, scopeOrPackage, pkg, 'mocks'));
          }
        } else {
          addMocksDir(path.join(packagesDir, scopeOrPackage, 'mocks'));
        }
      }
      break;
    }
  }
  return index;
}

/** @param {string} dir */
function safeReaddir(dir) {
  try {
    return fs.readdirSync(dir);
  } catch {
    return [];
  }
}

const nativeModuleMocks = indexNativeModuleMocks();

/**
 * Load a `mocks/<name>.ts` file synchronously. Node 22.6+ strips TypeScript types natively, which
 * is enough for the generated mock files (plain functions with type annotations).
 * @param {string} name
 * @returns {Record<string, any> | null}
 */
function loadNativeModuleMock(name) {
  const file = nativeModuleMocks.get(name);
  if (!file) {
    return null;
  }
  try {
    return projectRequire(file);
  } catch (error) {
    console.warn(`@expo/vitest: failed to load native module mock ${file}:`, error);
    return null;
  }
}

vi.mock('expo-modules-core', async (importOriginal) => {
  const ExpoModulesCore = /** @type {any} */ (await importOriginal());
  const { EventEmitter, NativeModule, SharedObject } = /** @type {any} */ (globalThis).expo;

  // After the NativeModules mock is set up, we can mock NativeModuleProxy's functions that call
  // into the native proxy module. We're not really interested in checking whether the underlying
  // method is called, just that the proxy method is called.
  const { NativeModulesProxy } = ExpoModulesCore;
  for (const moduleName of Object.keys(NativeModulesProxy)) {
    const nativeModule = NativeModulesProxy[moduleName];
    for (const propertyName of Object.keys(nativeModule)) {
      if (typeof nativeModule[propertyName] === 'function') {
        nativeModule[propertyName] = vi.fn(async () => {});
      }
    }
  }

  /** @param {string} name */
  function requireMockModule(name) {
    // Support auto-mocking of expo-modules that:
    // 1. have a mock in the `mocks` directory
    // 2. the native module (e.g. ExpoCrypto) name matches the package name (expo-crypto)
    const nativeModuleMock =
      loadNativeModuleMock(name) ?? ExpoModulesCore.requireOptionalNativeModule(name);
    if (!nativeModuleMock) {
      return null;
    }

    const nativeModule = new NativeModule();
    for (const [key, value] of Object.entries(nativeModuleMock)) {
      if (typeof value === 'function') {
        // Don't wrap classes with vi.fn() as it destroys the prototype chain needed for
        // `extends` (e.g. File extends ExpoFileSystem.FileSystemFile).
        const isClass = Object.getOwnPropertyNames(value.prototype ?? {}).length > 1;
        nativeModule[key] = isClass ? value : vi.fn(value);
      } else {
        nativeModule[key] = value;
      }
    }
    return nativeModule;
  }

  return {
    ...ExpoModulesCore,

    // Use web implementations for the common classes written natively
    EventEmitter,
    NativeModule,
    SharedObject,

    // Mock the `createSnapshotFriendlyRef` to return an ref that can be serialized in snapshots.
    createSnapshotFriendlyRef: () => {
      // We cannot use `createRef` since it is not extensible.
      const ref = { current: null };
      Object.defineProperty(ref, 'toJSON', { value: () => '[React.ref]' });
      return ref;
    },

    requireOptionalNativeModule: requireMockModule,
    /** @param {string} moduleName */
    requireNativeModule(moduleName) {
      const module = requireMockModule(moduleName);
      if (!module) {
        throw new Error(`Cannot find native module '${moduleName}'`);
      }
      return module;
    },
    /** @param {string} name */
    requireNativeViewManager: (name) => {
      const nativeModuleMock = loadNativeModuleMock(name);
      if (!nativeModuleMock || !nativeModuleMock.View) {
        return ExpoModulesCore.requireNativeViewManager(name);
      }
      return nativeModuleMock.View;
    },
  };
});

// Installs web implementations of the global.expo object for all platforms to polyfill APIs that
// are normally installed through JSI.
// The specifiers are widened to `string` so the type checker does not pull the Expo sources into
// this package's program; they resolve at runtime through the `expo-source` condition.
/** @param {string} specifier */
const importFromProject = (specifier) => import(specifier);

const { installExpoGlobalPolyfill } = await importFromProject(
  'expo-modules-core/src/polyfill/dangerous-internal'
);
installExpoGlobalPolyfill();

// `expo/fetch` defines `class FetchResponse extends ExpoFetchModule.NativeResponse` at module
// load — provide stub classes so tests that transitively import fetch don't need to mock
// `ExpoFetchModule` themselves.
const expoGlobal = /** @type {any} */ (globalThis).expo;
expoGlobal.modules.ExpoFetchModule = {
  NativeRequest: class extends expoGlobal.SharedObject {
    start() {}
    cancel() {}
  },
  NativeResponse: class extends expoGlobal.SharedObject {
    startStreaming() {}
    cancelStreaming() {}
    arrayBuffer() {}
    text() {}
  },
};

// Ensure the environment globals are installed before the first test runs.
await importFromProject('expo/src/winter');

// Normally injected by Metro.
if (process.env.EXPO_OS !== 'web' && typeof window !== 'undefined') {
  await importFromProject('expo/virtual/streams');
}
