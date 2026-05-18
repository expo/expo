/* eslint-disable @typescript-eslint/no-require-imports */
const mockNative = {
  configure: jest.fn(),
  setBundleDefaults: jest.fn(),
  dispatchEvents: jest.fn(() => Promise.resolve()),
};

jest.mock('expo', () => ({
  requireNativeModule: jest.fn(() => mockNative),
}));

jest.mock('../integrations/expo-router/router', () => ({
  isRouterInstalled: true,
  optionalRouter: undefined,
}));

jest.mock('../integrations/expo-router/init', () => ({
  initRouterIntegration: jest.fn(),
  isInitialized: jest.fn(() => false),
  initListeners: jest.fn(() => () => {}),
}));

beforeEach(() => {
  jest.clearAllMocks();
  jest.resetModules();
  jest.doMock('expo', () => ({ requireNativeModule: jest.fn(() => mockNative) }));
  jest.doMock('../integrations/expo-router/router', () => ({
    isRouterInstalled: true,
    optionalRouter: undefined,
  }));
  jest.doMock('../integrations/expo-router/init', () => ({
    initRouterIntegration: jest.fn(),
    isInitialized: jest.fn(() => false),
    initListeners: jest.fn(() => () => {}),
  }));
});

function loadModule() {
  return require('../module').default as typeof import('../module').default;
}

function loadInit() {
  return require('../integrations/expo-router/init') as typeof import('../integrations/expo-router/init');
}

describe('module Proxy', () => {
  it('strips disableRouterIntegration from the config forwarded to native', () => {
    const ExpoObserve = loadModule();
    ExpoObserve.configure({ environment: 'test', disableRouterIntegration: true });
    expect(mockNative.configure).toHaveBeenCalledWith({ environment: 'test' });
  });

  it('calls initRouterIntegration when router is installed and integration is enabled', () => {
    const ExpoObserve = loadModule();
    const { initRouterIntegration } = loadInit();
    ExpoObserve.configure({ environment: 'test' });
    expect(initRouterIntegration).toHaveBeenCalledTimes(1);
  });

  it('skips initRouterIntegration when disableRouterIntegration is true', () => {
    const ExpoObserve = loadModule();
    const { initRouterIntegration } = loadInit();
    ExpoObserve.configure({ disableRouterIntegration: true });
    expect(initRouterIntegration).not.toHaveBeenCalled();
  });

  it('skips initRouterIntegration when router is not installed', () => {
    jest.doMock('../integrations/expo-router/router', () => ({
      isRouterInstalled: false,
      optionalRouter: undefined,
    }));
    const ExpoObserve = loadModule();
    const { initRouterIntegration } = loadInit();
    ExpoObserve.configure({});
    expect(initRouterIntegration).not.toHaveBeenCalled();
  });

  it('passes through dispatchEvents and setBundleDefaults to native', () => {
    const ExpoObserve = loadModule();
    ExpoObserve.dispatchEvents();
    ExpoObserve.setBundleDefaults({ environment: 'production', isJsDev: false });
    expect(mockNative.dispatchEvents).toHaveBeenCalledTimes(1);
    expect(mockNative.setBundleDefaults).toHaveBeenCalledWith({
      environment: 'production',
      isJsDev: false,
    });
  });

  it('returns the native function via Reflect.get for unknown props', () => {
    const ExpoObserve = loadModule();
    expect((ExpoObserve as { dispatchEvents: unknown }).dispatchEvents).toBe(
      mockNative.dispatchEvents
    );
  });
});
