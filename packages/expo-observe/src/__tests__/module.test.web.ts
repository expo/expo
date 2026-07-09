import AppMetrics from 'expo-app-metrics';

import { ExpoObserveModule } from '../module.web';
import { getAppConfig } from '../web/appConfig';

// babel-preset-expo inlines `process.env.APP_MANIFEST` at transform time (also under
// jest), so the app config must be stubbed at the module seam rather than via the
// environment variable.
jest.mock('../web/appConfig', () => ({ getAppConfig: jest.fn() }));
const getAppConfigMock = getAppConfig as jest.Mock;

function lastRequestBody(fetchMock: jest.Mock) {
  const [, options] = fetchMock.mock.calls[fetchMock.mock.calls.length - 1];
  return JSON.parse(options.body);
}

async function drainAsync() {
  await new Promise((resolve) => setTimeout(resolve, 0));
}

// Dispatch state (config, cursor, schedulers) lives on the module instance, so each
// test constructs a fresh instance instead of fighting the `registerWebModule` cache.
function makeModule(): ExpoObserveModule {
  const observe = new ExpoObserveModule();
  observe.setBundleDefaults({ environment: 'test', isJsDev: false });
  return observe;
}

if (typeof window !== 'undefined') {
  let Observe: ExpoObserveModule;
  let fetchMock: jest.Mock;

  beforeEach(async () => {
    getAppConfigMock.mockReturnValue({ extra: { eas: { projectId: 'pid' } } });
    fetchMock = jest.fn().mockResolvedValue({ ok: true });
    (globalThis as any).fetch = fetchMock;
    localStorage.clear();
    await AppMetrics.clearStoredEntries();
    Observe = makeModule();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('dispatches pending logs as OTLP JSON to the project endpoint', async () => {
    Observe.logEvent('checkout', { attributes: { sku: 'abc' } });
    await Observe.dispatchEvents();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe('https://o.expo.dev/pid/v1/logs');
    expect(options.method).toBe('POST');
    expect(options.headers).toEqual({
      'Content-Type': 'application/json',
      'Expo-AppMetrics-Skip': '1',
    });
    expect(options.keepalive).toBe(false);

    const body = lastRequestBody(fetchMock);
    const [logRecord] = body.resourceLogs[0].scopeLogs[0].logRecords;
    expect(logRecord.attributes).toEqual(
      expect.arrayContaining([
        { key: 'session.id', value: { stringValue: AppMetrics.getMainSession().id } },
        { key: 'event.name', value: { stringValue: 'checkout' } },
        { key: 'sku', value: { stringValue: 'abc' } },
      ])
    );
  });

  it('attaches web resource attributes', async () => {
    Observe.configure({ environment: 'staging' });
    Observe.logEvent('event');
    await Observe.dispatchEvents();

    const { attributes } = lastRequestBody(fetchMock).resourceLogs[0].resource;
    expect(attributes).toEqual(
      expect.arrayContaining([
        { key: 'telemetry.sdk.name', value: { stringValue: 'expo-observe' } },
        { key: 'telemetry.sdk.language', value: { stringValue: 'webjs' } },
        { key: 'browser.language', value: { stringValue: navigator.language } },
        {
          key: 'expo.eas_client.id',
          value: { stringValue: localStorage.getItem('expo-observe.client-id') },
        },
        { key: 'expo.environment', value: { stringValue: 'staging' } },
      ])
    );
  });

  it('falls back to the bundle environment when configure sets none', async () => {
    Observe.logEvent('event');
    await Observe.dispatchEvents();
    expect(lastRequestBody(fetchMock).resourceLogs[0].resource.attributes).toContainEqual({
      key: 'expo.environment',
      value: { stringValue: 'test' },
    });
  });

  it('only dispatches records once', async () => {
    Observe.logEvent('first');
    await Observe.dispatchEvents();
    await Observe.dispatchEvents();
    expect(fetchMock).toHaveBeenCalledTimes(1);

    Observe.logEvent('second');
    await Observe.dispatchEvents();
    expect(fetchMock).toHaveBeenCalledTimes(2);
    const [logRecord, ...rest] = lastRequestBody(fetchMock).resourceLogs[0].scopeLogs[0].logRecords;
    expect(rest).toEqual([]);
    expect(logRecord.attributes).toContainEqual({
      key: 'event.name',
      value: { stringValue: 'second' },
    });
  });

  it('marks records as sent without dispatching when dispatching is disabled', async () => {
    Observe.configure({ dispatchingEnabled: false });
    Observe.logEvent('while-disabled');
    await Observe.dispatchEvents();
    expect(fetchMock).not.toHaveBeenCalled();

    // Re-enabling must not resend records that were pending while disabled.
    Observe.configure({});
    await Observe.dispatchEvents();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('skips dispatch in debug bundles unless dispatchInDebug is set', async () => {
    Observe.setBundleDefaults({ environment: 'test', isJsDev: true });
    Observe.logEvent('debug-event');
    await Observe.dispatchEvents();
    expect(fetchMock).not.toHaveBeenCalled();

    Observe.configure({ dispatchInDebug: true });
    Observe.logEvent('debug-event-opted-in');
    await Observe.dispatchEvents();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('applies the sample rate deterministically per installation', async () => {
    Observe.configure({ sampleRate: 0 });
    Observe.logEvent('sampled-out');
    await Observe.dispatchEvents();
    expect(fetchMock).not.toHaveBeenCalled();

    Observe.configure({ sampleRate: 1 });
    Observe.logEvent('sampled-in');
    await Observe.dispatchEvents();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('reuses the persisted client id across module instances', async () => {
    Observe.logEvent('one');
    await Observe.dispatchEvents();
    const clientId = localStorage.getItem('expo-observe.client-id');
    expect(clientId).toBeTruthy();

    const secondInstance = makeModule();
    secondInstance.logEvent('two');
    await secondInstance.dispatchEvents();
    expect(localStorage.getItem('expo-observe.client-id')).toBe(clientId);
    expect(lastRequestBody(fetchMock).resourceLogs[0].resource.attributes).toContainEqual({
      key: 'expo.eas_client.id',
      value: { stringValue: clientId },
    });
  });

  it('respects the endpoint override from the app config', async () => {
    getAppConfigMock.mockReturnValue({
      extra: { eas: { projectId: 'pid', observe: { endpointUrl: 'https://custom.example.com' } } },
    });
    Observe.logEvent('event');
    await Observe.dispatchEvents();
    expect(fetchMock).toHaveBeenCalledWith(
      'https://custom.example.com/pid/v1/logs',
      expect.anything()
    );
  });

  it('warns once and skips dispatch when the app config has no project id', async () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    getAppConfigMock.mockReturnValue(null);
    Observe.logEvent('one');
    await Observe.dispatchEvents();
    Observe.logEvent('two');
    await Observe.dispatchEvents();
    expect(fetchMock).not.toHaveBeenCalled();
    expect(warnSpy).toHaveBeenCalledTimes(1);
  });

  it('schedules a periodic flush on configure', async () => {
    const setIntervalSpy = jest.spyOn(globalThis, 'setInterval');
    Observe.configure({});
    Observe.configure({});
    expect(setIntervalSpy).toHaveBeenCalledTimes(1);
    expect(setIntervalSpy).toHaveBeenCalledWith(expect.any(Function), 30_000);

    Observe.logEvent('periodic');
    (setIntervalSpy.mock.calls[0]![0] as () => void)();
    await drainAsync();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][1].keepalive).toBe(false);
  });

  it('flushes with keepalive when the tab is hidden', async () => {
    const addEventListenerSpy = jest.spyOn(document, 'addEventListener');
    Observe.configure({});
    const visibilityHandler = addEventListenerSpy.mock.calls.find(
      ([type]) => type === 'visibilitychange'
    )?.[1] as EventListener;
    expect(visibilityHandler).toBeDefined();

    Observe.logEvent('goodbye');
    Object.defineProperty(document, 'visibilityState', { value: 'hidden', configurable: true });
    visibilityHandler(new Event('visibilitychange'));
    await drainAsync();
    Object.defineProperty(document, 'visibilityState', { value: 'visible', configurable: true });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][1].keepalive).toBe(true);
  });

  it('stores the integrations config from configure', () => {
    expect(Observe.getIntegrations()).toEqual({});
    Observe.configure({ integrations: { 'expo-router': true } });
    expect(Observe.getIntegrations()).toEqual({ 'expo-router': true });
  });
} else {
  it('does nothing in server environments', async () => {
    const fetchMock = jest.fn();
    (globalThis as any).fetch = fetchMock;
    const Observe = makeModule();
    expect(() => Observe.configure({})).not.toThrow();
    await expect(Observe.dispatchEvents()).resolves.toBeUndefined();
    expect(fetchMock).not.toHaveBeenCalled();
  });
}
