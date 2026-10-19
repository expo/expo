/* eslint-disable @typescript-eslint/no-require-imports */
import type { ObserveModuleEvents } from '../types';

const CONFIGURE = 'configure' satisfies keyof ObserveModuleEvents;
const configureListeners = new Set<
  (payload: Parameters<ObserveModuleEvents['configure']>[0]) => void
>();
let integrations: Record<string, unknown> | undefined;
let remove = jest.fn();

const mockNativeTarget = {
  getIntegrations: jest.fn(() => integrations),
  addListener: jest.fn(
    (
      _event: typeof CONFIGURE,
      listener: (payload: Parameters<ObserveModuleEvents['configure']>[0]) => void
    ) => {
      configureListeners.add(listener);
      remove = jest.fn(() => configureListeners.delete(listener));
      return { remove };
    }
  ),
};
const mockNative = new Proxy(mockNativeTarget, {
  has: () => true,
});

const mockAppMetrics = {
  registerIntegration: jest.fn(),
};

jest.mock('expo', () => ({
  requireNativeModule: jest.fn(() => mockNative),
}));

jest.mock('expo-app-metrics', () => ({
  __esModule: true,
  default: mockAppMetrics,
}));

jest.mock('../integrations/expo-router/router', () => ({
  isRouterInstalled: false,
}));

jest.mock('../integrations/expo-router/init', () => ({
  initRouterIntegration: jest.fn(),
}));

jest.mock('../integrations/react-navigation/reactNavigation', () => ({
  isReactNavigationInstalled: false,
}));

jest.mock('../integrations/react-navigation/init', () => ({
  initReactNavigationIntegration: jest.fn(),
}));

function loadModule() {
  return require('../module').default as typeof import('../module').default;
}

function emit(integrations: Parameters<ObserveModuleEvents['configure']>[0]['integrations']) {
  for (const listener of [...configureListeners]) {
    listener({ integrations });
  }
}

beforeEach(() => {
  jest.clearAllMocks();
  jest.resetModules();
  integrations = undefined;
  configureListeners.clear();
});

describe('Observe.registerIntegration', () => {
  it('calls the callback synchronously without adding a listener when the key is present', () => {
    integrations = { 'expo-router': true };
    const callback = jest.fn();

    loadModule().registerIntegration('expo-router', callback);

    expect(callback).toHaveBeenCalledWith(true);
    expect(mockNativeTarget.addListener).not.toHaveBeenCalled();
  });

  it.each([false, undefined])(
    'does not call the callback or add a listener when the current value is %s',
    (value) => {
      integrations = { 'expo-router': value };
      const callback = jest.fn();

      loadModule().registerIntegration('expo-router', callback);

      expect(callback).not.toHaveBeenCalled();
      expect(mockNativeTarget.addListener).not.toHaveBeenCalled();
    }
  );

  it('does not call the callback or add a listener when the initial object omits the key', () => {
    integrations = {};
    const callback = jest.fn();

    loadModule().registerIntegration('expo-router', callback);

    expect(callback).not.toHaveBeenCalled();
    expect(mockNativeTarget.addListener).not.toHaveBeenCalled();
  });

  it('adds a listener when the initial integrations value is falsy', () => {
    const callback = jest.fn();

    loadModule().registerIntegration('expo-router', callback);

    expect(mockNativeTarget.addListener).toHaveBeenCalledWith(CONFIGURE, expect.any(Function));
    expect(callback).not.toHaveBeenCalled();
  });

  it('removes the subscription before calling the callback when an event contains the key', () => {
    const callback = jest.fn(() => expect(remove).toHaveBeenCalledTimes(1));
    loadModule().registerIntegration('expo-router', callback);

    emit({ 'expo-router': true });

    expect(callback).toHaveBeenCalledWith(true);
    expect(remove).toHaveBeenCalledTimes(1);
  });

  it('removes the subscription without calling the callback when an event omits the key', () => {
    const callback = jest.fn();
    loadModule().registerIntegration('expo-router', callback);

    emit({});

    expect(callback).not.toHaveBeenCalled();
    expect(remove).toHaveBeenCalledTimes(1);

    emit({ 'expo-router': true });
    expect(callback).not.toHaveBeenCalled();
  });

  it('calls the callback at most once across multiple events', () => {
    const callback = jest.fn();
    loadModule().registerIntegration('expo-router', callback);

    emit({ 'expo-router': true });
    emit({ 'expo-router': false });

    expect(callback).toHaveBeenCalledTimes(1);
  });

  it.each([false, undefined])(
    'removes the subscription without calling the callback when an event value is %s',
    (value) => {
      const callback = jest.fn();
      loadModule().registerIntegration('expo-router', callback);

      emit({ 'expo-router': value });

      expect(callback).not.toHaveBeenCalled();
      expect(remove).toHaveBeenCalledTimes(1);
    }
  );

  it('leaves no listener behind when the callback throws', () => {
    const callback = jest.fn(() => {
      throw new Error('callback failed');
    });
    loadModule().registerIntegration('expo-router', callback);

    expect(() => emit({ 'expo-router': true })).toThrow('callback failed');
    expect(() => emit({ 'expo-router': false })).not.toThrow();
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('passes object values through unchanged', () => {
    const config = { filteredParams: ['token'] };
    integrations = { 'expo-router': config };
    const objectCallback = jest.fn();
    loadModule().registerIntegration('expo-router', objectCallback);
    expect(objectCallback).toHaveBeenCalledTimes(1);
    expect(objectCallback.mock.calls[0][0]).toBe(config);
  });

  it('does not forward registerIntegration to AppMetrics', () => {
    const callback = jest.fn();

    loadModule().registerIntegration('expo-router', callback);

    expect(mockAppMetrics.registerIntegration).not.toHaveBeenCalled();
    expect(mockNativeTarget.getIntegrations).toHaveBeenCalledTimes(1);
  });
});
