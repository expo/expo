jest.mock('react-native', () => {
  const ReactNative = jest.requireActual('react-native');
  return {
    ...ReactNative,
    TurboModuleRegistry: {
      ...ReactNative.TurboModuleRegistry,
      get: jest.fn(),
    },
  };
});

// eslint-disable-next-line import/first
import { TurboModuleRegistry } from 'react-native';

describe('ensureNativeModulesAreInstalled (native, no `ExpoModulesCore` turbo module)', () => {
  const originalExpo = globalThis.expo;

  beforeEach(() => {
    jest.resetModules();
    // @ts-expect-error - deliberately tearing down the global to simulate a runtime
    // that never installed it (e.g. no native `ExpoModulesCore` on this platform).
    delete globalThis.expo;
    (TurboModuleRegistry.get as jest.Mock).mockReturnValue(null);
  });

  afterAll(() => {
    globalThis.expo = originalExpo;
  });

  it('falls back to the pure-JS polyfill instead of leaving `globalThis.expo` undefined', () => {
    const { ensureNativeModulesAreInstalled } = require('../ensureNativeModulesAreInstalled.native');

    ensureNativeModulesAreInstalled();

    expect(globalThis.expo).toBeDefined();
    expect(globalThis.expo.EventEmitter).toBeDefined();
    expect(globalThis.expo.NativeModule).toBeDefined();
    expect(globalThis.expo.SharedObject).toBeDefined();
  });

  it('lets the EventEmitter/NativeModule base classes construct without throwing', () => {
    const { ensureNativeModulesAreInstalled } = require('../ensureNativeModulesAreInstalled.native');

    ensureNativeModulesAreInstalled();

    // Before the fallback, this line is what actually crashed on platforms with no
    // native `ExpoModulesCore` module: `globalThis.expo` was `undefined`, so reading
    // `.EventEmitter` off of it threw `Cannot read properties of undefined`.
    expect(() => new globalThis.expo.EventEmitter()).not.toThrow();
  });

  it('still prefers the native `ExpoModulesCore` module when one is registered', () => {
    const installModules = jest.fn();
    (TurboModuleRegistry.get as jest.Mock).mockReturnValue({ installModules });

    const { ensureNativeModulesAreInstalled } = require('../ensureNativeModulesAreInstalled.native');
    ensureNativeModulesAreInstalled();

    expect(installModules).toHaveBeenCalledTimes(1);
    // The polyfill must NOT run when a native module already handles installation,
    // so `globalThis.expo` stays whatever the native side set it to (unset in this
    // mock, since `installModules` doesn't do anything here).
    expect(globalThis.expo).toBeUndefined();
  });
});
