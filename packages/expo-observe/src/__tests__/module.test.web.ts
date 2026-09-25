/* eslint-disable @typescript-eslint/no-require-imports */
export {};

type MockListener = (payload: unknown) => void;

// The web `NativeModule` is an event emitter; `configure` broadcasts through it.
class MockNativeModule {
  private listeners = new Set<MockListener>();
  addListener(_event: string, listener: MockListener) {
    this.listeners.add(listener);
    return { remove: () => this.listeners.delete(listener) };
  }
  emit(_event: string, payload: unknown) {
    this.listeners.forEach((listener) => listener(payload));
  }
}

jest.mock('expo', () => ({
  NativeModule: MockNativeModule,
  registerWebModule: (moduleClass: new () => unknown) => new moduleClass(),
}));

const mockAppMetrics = {
  markFirstRender: jest.fn(),
  markInteractive: jest.fn(),
  setNetworkTracesConfig: jest.fn(),
};
const mockSetErrorHandlerEnabled = jest.fn();

jest.mock('expo-app-metrics', () => ({
  __esModule: true,
  default: mockAppMetrics,
  setErrorHandlerEnabled: mockSetErrorHandlerEnabled,
}));

jest.mock('../web/dispatch', () => ({
  dispatch: jest.fn(async () => {}),
  setDispatchConfig: jest.fn(),
  setDispatchBundleDefaults: jest.fn(),
}));

jest.mock('../web/storage', () => ({
  storeLog: jest.fn(),
  storeReportedError: jest.fn(),
  setGlobalAttributes: jest.fn(),
}));

jest.mock('../integrations/expo-router/router', () => ({
  isRouterInstalled: true,
  optionalRouter: undefined,
}));

jest.mock('../integrations/expo-router/init', () => ({
  initRouterIntegration: jest.fn(),
  isInitialized: jest.fn(() => false),
  getRouterIntegrationConfig: jest.fn(() => undefined),
  initListeners: jest.fn(() => () => {}),
}));

jest.mock('../integrations/react-navigation/reactNavigation', () => ({
  isReactNavigationInstalled: true,
  optionalReactNavigation: undefined,
}));

jest.mock('../integrations/react-navigation/init', () => ({
  initReactNavigationIntegration: jest.fn(),
  isInitialized: jest.fn(() => false),
  getReactNavigationIntegrationConfig: jest.fn(() => undefined),
}));

beforeEach(() => {
  jest.clearAllMocks();
  jest.resetModules();
});

function loadWebModule() {
  // `registerWebModule` returns the singleton instance, but its return type is the class itself,
  // so cast to the module interface to read instance members.
  return require('../module.web').default as unknown as import('../types').ObserveModule;
}

function loadDispatch() {
  return require('../web/dispatch') as typeof import('../web/dispatch');
}

function loadStorage() {
  return require('../web/storage') as typeof import('../web/storage');
}

function loadRouterInit() {
  return require('../integrations/expo-router/init') as typeof import('../integrations/expo-router/init');
}

function loadReactNavigationInit() {
  return require('../integrations/react-navigation/init') as typeof import('../integrations/react-navigation/init');
}

describe('web module', () => {
  it('reports clientId as null, because there is no EAS client id on web', () => {
    const Observe = loadWebModule();
    expect(Observe.clientId).toBeNull();
  });

  it('stays a no-op until configure enables the web implementation', () => {
    const Observe = loadWebModule();
    const { initRouterIntegration } = loadRouterInit();
    const listener = jest.fn();
    Observe.addListener('configure', listener);

    Observe.configure({ integrations: { 'expo-router': true } });

    expect(initRouterIntegration).not.toHaveBeenCalled();
    expect(mockSetErrorHandlerEnabled).not.toHaveBeenCalled();
    expect(Observe.getIntegrations()).toEqual({});
    expect(listener).not.toHaveBeenCalled();
  });

  it('initializes the expo-router integration from configure', () => {
    const Observe = loadWebModule();
    const { initRouterIntegration } = loadRouterInit();
    const { initReactNavigationIntegration } = loadReactNavigationInit();

    Observe.configure({
      web: true,
      integrations: { 'expo-router': { filteredParams: ['token'] } },
    });

    expect(initRouterIntegration).toHaveBeenCalledWith({ filteredParams: ['token'] });
    expect(initReactNavigationIntegration).not.toHaveBeenCalled();
  });

  it('initializes the react-navigation integration from configure', () => {
    const Observe = loadWebModule();
    const { initRouterIntegration } = loadRouterInit();
    const { initReactNavigationIntegration } = loadReactNavigationInit();

    Observe.configure({ web: true, integrations: { 'react-navigation': true } });

    expect(initReactNavigationIntegration).toHaveBeenCalledWith(true);
    expect(initRouterIntegration).not.toHaveBeenCalled();
  });

  it('initializes no integration when configure omits them', () => {
    const Observe = loadWebModule();
    const { initRouterIntegration } = loadRouterInit();
    const { initReactNavigationIntegration } = loadReactNavigationInit();

    Observe.configure({ web: true, environment: 'test' });

    expect(initRouterIntegration).not.toHaveBeenCalled();
    expect(initReactNavigationIntegration).not.toHaveBeenCalled();
  });

  it('applies the shared JS-side settings from configure', () => {
    const Observe = loadWebModule();

    Observe.configure({ web: true, errorHandlingEnabled: false, networkTraces: true });

    expect(mockSetErrorHandlerEnabled).toHaveBeenCalledWith(false);
    expect(mockAppMetrics.setNetworkTracesConfig).toHaveBeenCalledWith({ enabled: true });
  });

  it('returns the integrations from the latest configure call', () => {
    const Observe = loadWebModule();
    expect(Observe.getIntegrations()).toEqual({});

    Observe.configure({ web: true, integrations: { 'expo-router': true } });
    expect(Observe.getIntegrations()).toEqual({ 'expo-router': true });

    Observe.configure({ web: true, environment: 'test' });
    expect(Observe.getIntegrations()).toEqual({});
  });

  it('keeps its own copy of the integrations, like the native bridge does', () => {
    const Observe = loadWebModule();
    const integrations = { 'expo-router': true };
    Observe.configure({ web: true, integrations });

    integrations['expo-router'] = false;

    expect(Observe.getIntegrations()).toEqual({ 'expo-router': true });
  });

  it('emits configure with the resolved integrations', () => {
    const Observe = loadWebModule();
    const listener = jest.fn();
    Observe.addListener('configure', listener);

    Observe.configure({ web: true, integrations: { 'expo-router': true } });
    Observe.configure({ web: true, environment: 'test' });

    expect(listener).toHaveBeenNthCalledWith(1, { integrations: { 'expo-router': true } });
    expect(listener).toHaveBeenNthCalledWith(2, { integrations: {} });
  });

  it('calls a registerIntegration callback with the configured integration', () => {
    const Observe = loadWebModule();
    const callback = jest.fn();
    const config = { filteredParams: ['token'] };
    Observe.configure({ web: true, integrations: { 'expo-router': config } });

    Observe.registerIntegration('expo-router', callback);

    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback.mock.calls[0][0]).toBe(config);
  });

  it('does not call a registerIntegration callback for an integration that is off', () => {
    const Observe = loadWebModule();
    const callback = jest.fn();
    Observe.configure({ web: true, integrations: { 'expo-router': false } });

    Observe.registerIntegration('expo-router', callback);

    expect(callback).not.toHaveBeenCalled();
  });

  it('stores log events and global attributes in the web store', () => {
    const Observe = loadWebModule();
    const { storeLog, setGlobalAttributes } = loadStorage();

    Observe.logEvent('app_boot', { severity: 'info', body: 'boot' });
    Observe.setGlobalAttributes({ tier: 'pro' });

    expect(storeLog).toHaveBeenCalledWith('app_boot', { severity: 'info', body: 'boot' });
    expect(setGlobalAttributes).toHaveBeenCalledWith({ tier: 'pro' });
  });

  it('stores reported errors normalized like the native reportError path', () => {
    const Observe = loadWebModule();
    const { storeReportedError } = loadStorage();
    const error = new TypeError('x is not a function');

    Observe.reportError(error);
    Observe.reportError('plain string');

    expect(storeReportedError).toHaveBeenNthCalledWith(1, {
      type: 'TypeError',
      message: 'x is not a function',
      stacktrace: error.stack,
    });
    expect(storeReportedError).toHaveBeenNthCalledWith(2, { message: 'plain string' });
  });

  it('hands the config, bundle defaults, and dispatchEvents to the dispatcher', async () => {
    const Observe = loadWebModule();
    const { dispatch, setDispatchConfig, setDispatchBundleDefaults } = loadDispatch();
    const config = { web: true, sampleRate: 0.5 };
    const bundleDefaults = { environment: 'production', isJsDev: false };

    Observe.configure(config);
    Observe.setBundleDefaults(bundleDefaults);
    await Observe.dispatchEvents();

    expect(setDispatchConfig).toHaveBeenCalledWith(config);
    expect(setDispatchBundleDefaults).toHaveBeenCalledWith(bundleDefaults);
    expect(dispatch).toHaveBeenCalledTimes(1);
  });
});
