/* eslint-disable @typescript-eslint/no-require-imports */
import type { LogRecord } from 'expo-app-metrics';

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

let mockLogs: LogRecord[] = [];
const mockSession = {
  id: 'session-1',
  getLogs: jest.fn(async () => [...mockLogs]),
};
const mockAppMetrics = {
  logEvent: jest.fn(),
  markFirstRender: jest.fn(),
  markInteractive: jest.fn(),
  setGlobalAttributes: jest.fn(),
  setNetworkTracesConfig: jest.fn(),
  reportError: jest.fn(),
  getMainSession: jest.fn(() => mockSession),
};
const mockSetErrorHandlerEnabled = jest.fn();

jest.mock('expo-app-metrics', () => ({
  __esModule: true,
  default: mockAppMetrics,
  setErrorHandlerEnabled: mockSetErrorHandlerEnabled,
}));

const mockExpoConfig: {
  name?: string;
  slug?: string;
  version?: string;
  sdkVersion?: string;
  extra?: { eas?: { projectId?: string; observe?: { endpointUrl?: string } } };
} = {};

jest.mock('expo-constants', () => ({
  __esModule: true,
  default: { expoConfig: mockExpoConfig },
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

const mockFetch = jest.fn();
const realFetch = globalThis.fetch;

function mockResponse(status: number, retryAfter?: string) {
  mockFetch.mockResolvedValueOnce({
    status,
    headers: { get: (name: string) => (name === 'Retry-After' ? (retryAfter ?? null) : null) },
    text: async () => '{}',
  });
}

function sentBody(call = 0) {
  return JSON.parse(mockFetch.mock.calls[call]![1].body);
}

function sentRecordNames(call = 0) {
  return sentBody(call).resourceLogs[0].scopeLogs[0].logRecords.map(
    (record: { attributes: { key: string; value: { stringValue: string } }[] }) =>
      record.attributes.find((attribute) => attribute.key === 'event.name')!.value.stringValue
  );
}

let warnSpy: jest.SpyInstance;

beforeEach(() => {
  jest.clearAllMocks();
  jest.resetModules();
  globalThis.fetch = mockFetch;
  globalThis.localStorage?.clear();
  warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
  mockLogs = [
    { timestamp: '2026-09-18T10:00:00.000Z', name: 'first', severity: 'info' },
    { timestamp: '2026-09-18T10:00:01.000Z', name: 'second', severity: 'warn' },
  ];
  for (const key of Object.keys(mockExpoConfig) as (keyof typeof mockExpoConfig)[]) {
    delete mockExpoConfig[key];
  }
  Object.assign(mockExpoConfig, {
    name: 'Observe',
    slug: 'observability',
    version: '1.2.3',
    sdkVersion: '58.0.0',
    extra: { eas: { projectId: 'project-1' } },
  });
});

afterAll(() => {
  globalThis.fetch = realFetch;
});

function loadWebModule() {
  // `registerWebModule` returns the singleton instance, but its return type is the class itself,
  // so cast to the module interface to read instance members.
  const Observe = require('../module.web').default as unknown as import('../types').ObserveModule;
  // Mirror the package entry point, which pushes the bundle facts on import.
  Observe.setBundleDefaults({ environment: 'production', isJsDev: false });
  return Observe;
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

  it('initializes the expo-router integration from configure', () => {
    const Observe = loadWebModule();
    const { initRouterIntegration } = loadRouterInit();
    const { initReactNavigationIntegration } = loadReactNavigationInit();

    Observe.configure({ integrations: { 'expo-router': { filteredParams: ['token'] } } });

    expect(initRouterIntegration).toHaveBeenCalledWith({ filteredParams: ['token'] });
    expect(initReactNavigationIntegration).not.toHaveBeenCalled();
  });

  it('initializes the react-navigation integration from configure', () => {
    const Observe = loadWebModule();
    const { initRouterIntegration } = loadRouterInit();
    const { initReactNavigationIntegration } = loadReactNavigationInit();

    Observe.configure({ integrations: { 'react-navigation': true } });

    expect(initReactNavigationIntegration).toHaveBeenCalledWith(true);
    expect(initRouterIntegration).not.toHaveBeenCalled();
  });

  it('initializes no integration when configure omits them', () => {
    const Observe = loadWebModule();
    const { initRouterIntegration } = loadRouterInit();
    const { initReactNavigationIntegration } = loadReactNavigationInit();

    Observe.configure({ environment: 'test' });

    expect(initRouterIntegration).not.toHaveBeenCalled();
    expect(initReactNavigationIntegration).not.toHaveBeenCalled();
  });

  it('applies the shared JS-side settings from configure', () => {
    const Observe = loadWebModule();

    Observe.configure({ errorHandlingEnabled: false, networkTraces: true });

    expect(mockSetErrorHandlerEnabled).toHaveBeenCalledWith(false);
    expect(mockAppMetrics.setNetworkTracesConfig).toHaveBeenCalledWith({ enabled: true });
  });

  it('returns the integrations from the latest configure call', () => {
    const Observe = loadWebModule();
    expect(Observe.getIntegrations()).toEqual({});

    Observe.configure({ integrations: { 'expo-router': true } });
    expect(Observe.getIntegrations()).toEqual({ 'expo-router': true });

    Observe.configure({ environment: 'test' });
    expect(Observe.getIntegrations()).toEqual({});
  });

  it('keeps its own copy of the integrations, like the native bridge does', () => {
    const Observe = loadWebModule();
    const integrations = { 'expo-router': true };
    Observe.configure({ integrations });

    integrations['expo-router'] = false;

    expect(Observe.getIntegrations()).toEqual({ 'expo-router': true });
  });

  it('emits configure with the resolved integrations', () => {
    const Observe = loadWebModule();
    const listener = jest.fn();
    Observe.addListener('configure', listener);

    Observe.configure({ integrations: { 'expo-router': true } });
    Observe.configure({ environment: 'test' });

    expect(listener).toHaveBeenNthCalledWith(1, { integrations: { 'expo-router': true } });
    expect(listener).toHaveBeenNthCalledWith(2, { integrations: {} });
  });

  it('calls a registerIntegration callback with the configured integration', () => {
    const Observe = loadWebModule();
    const callback = jest.fn();
    const config = { filteredParams: ['token'] };
    Observe.configure({ integrations: { 'expo-router': config } });

    Observe.registerIntegration('expo-router', callback);

    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback.mock.calls[0][0]).toBe(config);
  });

  it('does not call a registerIntegration callback for an integration that is off', () => {
    const Observe = loadWebModule();
    const callback = jest.fn();
    Observe.configure({ integrations: { 'expo-router': false } });

    Observe.registerIntegration('expo-router', callback);

    expect(callback).not.toHaveBeenCalled();
  });

  it('forwards logEvent to AppMetrics', () => {
    const Observe = loadWebModule();
    Observe.logEvent('app_boot', { severity: 'info', body: 'boot' });
    expect(mockAppMetrics.logEvent).toHaveBeenCalledWith('app_boot', {
      severity: 'info',
      body: 'boot',
    });
  });
});

// The Node jest project has no `window`, which is the server-rendering case: nothing is stored
// there, so nothing is sent. The Web project runs under jsdom, which is the browser case.
if (typeof window === 'undefined') {
  it('dispatches nothing on the server', async () => {
    const Observe = loadWebModule();

    await Observe.dispatchEvents();

    expect(mockFetch).not.toHaveBeenCalled();
    expect(mockSession.getLogs).not.toHaveBeenCalled();
  });
}

(typeof window === 'undefined' ? describe.skip : describe)('dispatchEvents on web', () => {
  it('posts the pending logs as OTLP JSON to the project logs endpoint', async () => {
    const Observe = loadWebModule();
    Observe.configure({ environment: 'staging' });
    mockResponse(200);

    await Observe.dispatchEvents();

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [url, init] = mockFetch.mock.calls[0]!;
    expect(url).toBe('https://o.expo.dev/project-1/v1/logs');
    expect(init).toMatchObject({
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    expect(sentRecordNames()).toEqual(['first', 'second']);

    const body = sentBody();
    const resourceAttributes = Object.fromEntries(
      body.resourceLogs[0].resource.attributes.map(
        (attribute: { key: string; value: { stringValue: string } }) => [
          attribute.key,
          attribute.value.stringValue,
        ]
      )
    );
    expect(resourceAttributes).toEqual({
      'telemetry.sdk.name': 'expo-observe',
      'telemetry.sdk.version': expect.any(String),
      'telemetry.sdk.language': 'webjs',
      'browser.language': expect.any(String),
      'user_agent.original': expect.any(String),
      'service.name': 'observability',
      'service.version': '1.2.3',
      'expo.app.name': 'Observe',
      'expo.sdk.version': '58.0.0',
      'expo.environment': 'staging',
    });
    expect(body.resourceLogs[0].scopeLogs[0].logRecords[0].attributes).toContainEqual({
      key: 'session.id',
      value: { stringValue: 'session-1' },
    });
  });

  it('falls back to the bundle environment when configure sets none', async () => {
    const Observe = loadWebModule();
    mockResponse(200);

    await Observe.dispatchEvents();

    expect(sentBody().resourceLogs[0].resource.attributes).toContainEqual({
      key: 'expo.environment',
      value: { stringValue: 'production' },
    });
  });

  it('honors a custom endpointUrl from the app config', async () => {
    mockExpoConfig.extra = {
      eas: { projectId: 'project-1', observe: { endpointUrl: 'https://otel.example.com/' } },
    };
    const Observe = loadWebModule();
    mockResponse(200);

    await Observe.dispatchEvents();

    expect(mockFetch.mock.calls[0]![0]).toBe('https://otel.example.com/project-1/v1/logs');
  });

  it('sends each record once and picks up records logged later', async () => {
    const Observe = loadWebModule();
    mockResponse(200);
    await Observe.dispatchEvents();

    await Observe.dispatchEvents();
    expect(mockFetch).toHaveBeenCalledTimes(1);

    mockLogs.push({ timestamp: '2026-09-18T10:00:02.000Z', name: 'third', severity: 'info' });
    mockResponse(200);
    await Observe.dispatchEvents();

    expect(mockFetch).toHaveBeenCalledTimes(2);
    expect(sentRecordNames(1)).toEqual(['third']);
  });

  it('keeps the records and waits before retrying after a retryable failure', async () => {
    const Observe = loadWebModule();
    const nowSpy = jest.spyOn(Date, 'now').mockReturnValue(1_000_000);
    mockResponse(503, '120');
    await Observe.dispatchEvents();

    nowSpy.mockReturnValue(1_000_000 + 119_000);
    await Observe.dispatchEvents();
    expect(mockFetch).toHaveBeenCalledTimes(1);

    nowSpy.mockReturnValue(1_000_000 + 121_000);
    mockResponse(200);
    await Observe.dispatchEvents();

    expect(mockFetch).toHaveBeenCalledTimes(2);
    expect(sentRecordNames(1)).toEqual(['first', 'second']);
    nowSpy.mockRestore();
  });

  it('treats a network error as retryable', async () => {
    const Observe = loadWebModule();
    mockFetch.mockRejectedValueOnce(new TypeError('Failed to fetch'));
    await Observe.dispatchEvents();

    const nowSpy = jest.spyOn(Date, 'now').mockReturnValue(Date.now() + 60 * 60 * 1000);
    mockResponse(200);
    await Observe.dispatchEvents();

    expect(mockFetch).toHaveBeenCalledTimes(2);
    expect(sentRecordNames(1)).toEqual(['first', 'second']);
    nowSpy.mockRestore();
  });

  it('drops the batch after a non-retryable failure', async () => {
    const Observe = loadWebModule();
    mockResponse(400);
    await Observe.dispatchEvents();

    await Observe.dispatchEvents();

    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(warnSpy).toHaveBeenCalledTimes(1);
  });

  it('drops pending records without a request while dispatching is disabled', async () => {
    const Observe = loadWebModule();
    Observe.configure({ dispatchingEnabled: false });
    await Observe.dispatchEvents();
    expect(mockFetch).not.toHaveBeenCalled();

    Observe.configure({ dispatchingEnabled: true });
    await Observe.dispatchEvents();

    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('does not dispatch from a development bundle unless dispatchInDebug is set', async () => {
    const Observe = loadWebModule();
    Observe.setBundleDefaults({ environment: 'development', isJsDev: true });
    await Observe.dispatchEvents();
    expect(mockFetch).not.toHaveBeenCalled();

    mockLogs.push({ timestamp: '2026-09-18T10:00:02.000Z', name: 'third', severity: 'info' });
    Observe.configure({ dispatchInDebug: true });
    mockResponse(200);
    await Observe.dispatchEvents();

    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(sentRecordNames()).toEqual(['third']);
  });

  it('never dispatches when this installation is out of sample', async () => {
    const Observe = loadWebModule();
    Observe.configure({ sampleRate: 0 });

    await Observe.dispatchEvents();

    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('always dispatches with a sample rate of 1', async () => {
    const Observe = loadWebModule();
    Observe.configure({ sampleRate: 1 });
    mockResponse(200);

    await Observe.dispatchEvents();

    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('warns once and sends nothing without an EAS project id', async () => {
    delete mockExpoConfig.extra;
    const Observe = loadWebModule();

    await Observe.dispatchEvents();
    await Observe.dispatchEvents();

    expect(mockFetch).not.toHaveBeenCalled();
    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(warnSpy.mock.calls[0]![0]).toContain('projectId');
  });

  it('runs concurrent dispatches one after another', async () => {
    const Observe = loadWebModule();
    mockResponse(200);
    mockResponse(200);

    await Promise.all([Observe.dispatchEvents(), Observe.dispatchEvents()]);

    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('flushes with a keepalive request when the page is hidden', async () => {
    loadWebModule();
    mockFetch.mockResolvedValue({
      status: 200,
      headers: { get: () => null },
      text: async () => '{}',
    });
    Object.defineProperty(document, 'visibilityState', {
      value: 'hidden',
      configurable: true,
    });

    document.dispatchEvent(new Event('visibilitychange'));
    await new Promise((resolve) => setTimeout(resolve, 0));

    // Module instances from earlier tests still listen too, so only check that a flush happened.
    expect(mockFetch.mock.calls.some((call) => call[1].keepalive === true)).toBe(true);
  });
});
