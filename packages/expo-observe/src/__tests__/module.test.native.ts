/* eslint-disable @typescript-eslint/no-require-imports */
export {};

const mockNativeTarget = {
  configure: jest.fn(),
  setBundleDefaults: jest.fn(),
  dispatchEvents: jest.fn(() => Promise.resolve()),
};
// The real native module is a JSI host object.
// Mirror that here so the AppMetrics-fallback tests exercise the actual on-device bug — a fallback
// gated on `in`/`hasOwnProperty` would wrongly treat every prop as native and never forward.
const mockNative = new Proxy(mockNativeTarget, {
  has: () => true,
});

const mockAppMetrics = {
  logEvent: jest.fn(),
  markFirstRender: jest.fn(),
  markInteractive: jest.fn(),
  setGlobalAttributes: jest.fn(),
};

jest.mock('expo', () => ({
  requireNativeModule: jest.fn(() => mockNative),
}));

jest.mock('expo-app-metrics', () => ({
  __esModule: true,
  default: mockAppMetrics,
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

jest.mock('../integrations/react-navigation/reactNavigation', () => ({
  isReactNavigationInstalled: true,
  optionalReactNavigation: undefined,
}));

jest.mock('../integrations/react-navigation/init', () => ({
  initReactNavigationIntegration: jest.fn(),
  isInitialized: jest.fn(() => false),
}));

let warnSpy: jest.SpyInstance;

beforeEach(() => {
  jest.clearAllMocks();
  jest.resetModules();
  warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
  jest.doMock('expo', () => ({ requireNativeModule: jest.fn(() => mockNative) }));
  jest.doMock('expo-app-metrics', () => ({ __esModule: true, default: mockAppMetrics }));
  jest.doMock('../integrations/expo-router/router', () => ({
    isRouterInstalled: true,
    optionalRouter: undefined,
  }));
  jest.doMock('../integrations/expo-router/init', () => ({
    initRouterIntegration: jest.fn(),
    isInitialized: jest.fn(() => false),
    initListeners: jest.fn(() => () => {}),
  }));
  jest.doMock('../integrations/react-navigation/reactNavigation', () => ({
    isReactNavigationInstalled: true,
    optionalReactNavigation: undefined,
  }));
  jest.doMock('../integrations/react-navigation/init', () => ({
    initReactNavigationIntegration: jest.fn(),
    isInitialized: jest.fn(() => false),
  }));
});

function loadModule() {
  return require('../module').default as typeof import('../module').default;
}

function loadInit() {
  return require('../integrations/expo-router/init') as typeof import('../integrations/expo-router/init');
}

function loadReactNavigationInit() {
  return require('../integrations/react-navigation/init') as typeof import('../integrations/react-navigation/init');
}

describe('module Proxy', () => {
  it.each([true, false, undefined])(
    "forwards a integrations object to native when 'expo-router' is %s",
    (router) => {
      const Observe = loadModule();
      Observe.configure({
        environment: 'test',
        integrations: { 'expo-router': router },
      });
      expect(mockNative.configure).toHaveBeenCalledWith({
        environment: 'test',
        integrations: { 'expo-router': router },
      });
      expect(warnSpy).not.toHaveBeenCalled();
    }
  );

  it("calls initRouterIntegration when router is installed and integrations['expo-router'] is true", () => {
    const Observe = loadModule();
    const { initRouterIntegration } = loadInit();
    Observe.configure({
      environment: 'test',
      integrations: { 'expo-router': true },
    });
    expect(initRouterIntegration).toHaveBeenCalledTimes(1);
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it('skips initRouterIntegration by default', () => {
    const Observe = loadModule();
    const { initRouterIntegration } = loadInit();
    Observe.configure({ environment: 'test' });
    expect(initRouterIntegration).not.toHaveBeenCalled();
    expect(mockNative.configure).toHaveBeenCalledWith({
      environment: 'test',
    });
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it('skips initRouterIntegration when router is not installed, but passes the integrations object unchanged', () => {
    jest.doMock('../integrations/expo-router/router', () => ({
      isRouterInstalled: false,
      optionalRouter: undefined,
    }));
    jest.doMock('../integrations/react-navigation/reactNavigation', () => ({
      isReactNavigationInstalled: false,
      optionalReactNavigation: undefined,
    }));
    const Observe = loadModule();
    const { initRouterIntegration } = loadInit();
    Observe.configure({ integrations: { 'expo-router': true } });
    expect(initRouterIntegration).not.toHaveBeenCalled();
    expect(mockNative.configure).toHaveBeenCalledWith({
      integrations: { 'expo-router': true },
    });
  });

  it('warns when expo-router integration is enabled but expo-router is not installed', () => {
    jest.doMock('../integrations/expo-router/router', () => ({
      isRouterInstalled: false,
      optionalRouter: undefined,
    }));
    const Observe = loadModule();
    Observe.configure({ integrations: { 'expo-router': true } });
    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(warnSpy).toHaveBeenCalledWith(
      "[expo-observe] `integrations: { 'expo-router': true }` was set, but `expo-router` is not installed. The integration will not initialize."
    );
  });

  it('warns when react-navigation integration is enabled but @react-navigation/native is not installed', () => {
    jest.doMock('../integrations/react-navigation/reactNavigation', () => ({
      isReactNavigationInstalled: false,
      optionalReactNavigation: undefined,
    }));
    const Observe = loadModule();
    Observe.configure({ integrations: { 'react-navigation': true } });
    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(warnSpy).toHaveBeenCalledWith(
      "[expo-observe] `integrations: { 'react-navigation': true }` was set, but `@react-navigation/native` is not installed. The integration will not initialize."
    );
  });

  it('warns when both integrations resolve to init (router takes precedence)', () => {
    const Observe = loadModule();
    Observe.configure({
      integrations: { 'expo-router': true, 'react-navigation': true },
    });
    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(warnSpy).toHaveBeenCalledWith(
      "[expo-observe] Both 'expo-router' and 'react-navigation' integrations are enabled. " +
        "Only 'expo-router' will initialize; 'react-navigation' will be ignored. "
    );
  });

  it('warns once per missing peer but does not also warn about both-enabled when react-navigation is not installed', () => {
    jest.doMock('../integrations/react-navigation/reactNavigation', () => ({
      isReactNavigationInstalled: false,
      optionalReactNavigation: undefined,
    }));
    const Observe = loadModule();
    Observe.configure({
      integrations: { 'expo-router': true, 'react-navigation': true },
    });
    // Only the missing-peer warning fires; the 'both enabled' warning is gated
    // on shouldInitReactNavigationIntegration, which is false here.
    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(warnSpy).toHaveBeenCalledWith(
      "[expo-observe] `integrations: { 'react-navigation': true }` was set, but `@react-navigation/native` is not installed. The integration will not initialize."
    );
  });

  it('warns twice when both integrations are enabled but expo-router is not installed', () => {
    jest.doMock('../integrations/expo-router/router', () => ({
      isRouterInstalled: false,
      optionalRouter: undefined,
    }));
    const Observe = loadModule();
    Observe.configure({
      integrations: { 'expo-router': true, 'react-navigation': true },
    });
    // Missing-peer fires for expo-router; 'both enabled' is gated on
    // shouldInitRouterIntegration so it does not fire. react-navigation
    // initializes alone, no additional warning.
    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(warnSpy).toHaveBeenCalledWith(
      "[expo-observe] `integrations: { 'expo-router': true }` was set, but `expo-router` is not installed. The integration will not initialize."
    );
  });

  it("calls initReactNavigationIntegration when integrations['react-navigation'] is true and react-navigation is installed", () => {
    const Observe = loadModule();
    const { initReactNavigationIntegration } = loadReactNavigationInit();
    Observe.configure({
      environment: 'test',
      integrations: { 'react-navigation': true },
    });
    expect(initReactNavigationIntegration).toHaveBeenCalledTimes(1);
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it("initializes react-navigation even when expo-router is installed, as long as 'react-navigation' is the only flag set", () => {
    const Observe = loadModule();
    const { initRouterIntegration } = loadInit();
    const { initReactNavigationIntegration } = loadReactNavigationInit();
    Observe.configure({
      environment: 'test',
      integrations: { 'react-navigation': true },
    });
    expect(initRouterIntegration).not.toHaveBeenCalled();
    expect(initReactNavigationIntegration).toHaveBeenCalledTimes(1);
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it('does NOT call initReactNavigationIntegration when both flags are true', () => {
    const Observe = loadModule();
    const { initRouterIntegration } = loadInit();
    const { initReactNavigationIntegration } = loadReactNavigationInit();
    Observe.configure({
      environment: 'test',
      integrations: { 'expo-router': true, 'react-navigation': true },
    });
    expect(initRouterIntegration).toHaveBeenCalledTimes(1);
    expect(initReactNavigationIntegration).not.toHaveBeenCalled();
  });

  it('skips initReactNavigationIntegration when react-navigation is not installed', () => {
    jest.doMock('../integrations/react-navigation/reactNavigation', () => ({
      isReactNavigationInstalled: false,
      optionalReactNavigation: undefined,
    }));
    const Observe = loadModule();
    const { initReactNavigationIntegration } = loadReactNavigationInit();
    Observe.configure({
      environment: 'test',
      integrations: { 'react-navigation': true },
    });
    expect(initReactNavigationIntegration).not.toHaveBeenCalled();
  });

  it('skips both integrations by default', () => {
    const Observe = loadModule();
    const { initRouterIntegration } = loadInit();
    const { initReactNavigationIntegration } = loadReactNavigationInit();
    Observe.configure({ environment: 'test' });
    expect(initRouterIntegration).not.toHaveBeenCalled();
    expect(initReactNavigationIntegration).not.toHaveBeenCalled();
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it('passes through dispatchEvents and setBundleDefaults to native', () => {
    const Observe = loadModule();
    Observe.dispatchEvents();
    Observe.setBundleDefaults({ environment: 'production', isJsDev: false });
    expect(mockNative.dispatchEvents).toHaveBeenCalledTimes(1);
    expect(mockNative.setBundleDefaults).toHaveBeenCalledWith({
      environment: 'production',
      isJsDev: false,
    });
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it('returns the native function via Reflect.get for unknown props', () => {
    const Observe = loadModule();
    expect((Observe as { dispatchEvents: unknown }).dispatchEvents).toBe(mockNative.dispatchEvents);
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it('forwards logEvent to AppMetrics', () => {
    const Observe = loadModule();
    Observe.logEvent('app_boot', { severity: 'info', body: 'boot' });
    expect(mockAppMetrics.logEvent).toHaveBeenCalledWith('app_boot', {
      severity: 'info',
      body: 'boot',
    });
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it('forwards markFirstRender to AppMetrics', () => {
    const Observe = loadModule();
    Observe.markFirstRender();
    expect(mockAppMetrics.markFirstRender).toHaveBeenCalledTimes(1);
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it('forwards markInteractive to AppMetrics', () => {
    const Observe = loadModule();
    Observe.markInteractive({ routeName: '/home' });
    expect(mockAppMetrics.markInteractive).toHaveBeenCalledWith({ routeName: '/home' });
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it('forwards setGlobalAttributes to AppMetrics', () => {
    const Observe = loadModule();
    Observe.setGlobalAttributes({ tier: 'pro' });
    expect(mockAppMetrics.setGlobalAttributes).toHaveBeenCalledWith({ tier: 'pro' });
    expect(warnSpy).not.toHaveBeenCalled();
  });
});
