/* eslint-disable @typescript-eslint/no-require-imports */
import type { LogRecord } from 'expo-app-metrics';

let mockLogs: LogRecord[] = [];
const mockSession = {
  id: 'session-1',
  getLogs: jest.fn(async () => [...mockLogs]),
};

jest.mock('expo-app-metrics', () => ({
  __esModule: true,
  default: { getMainSession: jest.fn(() => mockSession) },
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

type Dispatch = typeof import('../dispatch');

// Loads a fresh dispatcher with the web implementation enabled and a production bundle, which is
// what the package entry point and `Observe.configure({ web: true })` set up.
function loadDispatch(config: import('../../types').ObserveConfig = {}): Dispatch {
  const dispatch = require('../dispatch') as Dispatch;
  dispatch.setDispatchBundleDefaults({ environment: 'production', isJsDev: false });
  dispatch.setDispatchConfig({ web: true, ...config });
  return dispatch;
}

// The Node jest project has no `window`, which is the server-rendering case: nothing is stored
// there, so nothing is sent. The Web project runs under jsdom, which is the browser case.
if (typeof window === 'undefined') {
  it('dispatches nothing on the server', async () => {
    const { dispatch } = loadDispatch();

    await dispatch();

    expect(mockFetch).not.toHaveBeenCalled();
    expect(mockSession.getLogs).not.toHaveBeenCalled();
  });
}

(typeof window === 'undefined' ? describe.skip : describe)('dispatch', () => {
  it('posts the pending logs as OTLP JSON to the project logs endpoint', async () => {
    const { dispatch } = loadDispatch({ environment: 'staging' });
    mockResponse(200);

    await dispatch();

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [url, init] = mockFetch.mock.calls[0]!;
    expect(url).toBe('https://o.expo.dev/project-1/v1/logs');
    expect(init).toMatchObject({
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      keepalive: false,
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

  it('does nothing until the web implementation is enabled', async () => {
    const dispatch = require('../dispatch') as Dispatch;
    dispatch.setDispatchBundleDefaults({ environment: 'production', isJsDev: false });
    dispatch.setDispatchConfig({});

    await dispatch.dispatch();
    expect(mockFetch).not.toHaveBeenCalled();

    dispatch.setDispatchConfig({ web: true });
    mockResponse(200);
    await dispatch.dispatch();

    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(sentRecordNames()).toEqual(['first', 'second']);
  });

  it('falls back to the bundle environment when configure sets none', async () => {
    const { dispatch } = loadDispatch();
    mockResponse(200);

    await dispatch();

    expect(sentBody().resourceLogs[0].resource.attributes).toContainEqual({
      key: 'expo.environment',
      value: { stringValue: 'production' },
    });
  });

  it('honors a custom endpointUrl from the app config', async () => {
    mockExpoConfig.extra = {
      eas: { projectId: 'project-1', observe: { endpointUrl: 'https://otel.example.com/' } },
    };
    const { dispatch } = loadDispatch();
    mockResponse(200);

    await dispatch();

    expect(mockFetch.mock.calls[0]![0]).toBe('https://otel.example.com/project-1/v1/logs');
  });

  it('sends each record once and picks up records logged later', async () => {
    const { dispatch } = loadDispatch();
    mockResponse(200);
    await dispatch();

    await dispatch();
    expect(mockFetch).toHaveBeenCalledTimes(1);

    mockLogs.push({ timestamp: '2026-09-18T10:00:02.000Z', name: 'third', severity: 'info' });
    mockResponse(200);
    await dispatch();

    expect(mockFetch).toHaveBeenCalledTimes(2);
    expect(sentRecordNames(1)).toEqual(['third']);
  });

  it('keeps the records and waits before retrying after a retryable failure', async () => {
    const { dispatch } = loadDispatch();
    const nowSpy = jest.spyOn(Date, 'now').mockReturnValue(1_000_000);
    mockResponse(503, '120');
    await dispatch();

    nowSpy.mockReturnValue(1_000_000 + 119_000);
    await dispatch();
    expect(mockFetch).toHaveBeenCalledTimes(1);

    nowSpy.mockReturnValue(1_000_000 + 121_000);
    mockResponse(200);
    await dispatch();

    expect(mockFetch).toHaveBeenCalledTimes(2);
    expect(sentRecordNames(1)).toEqual(['first', 'second']);
    nowSpy.mockRestore();
  });

  it('treats a network error as retryable', async () => {
    const { dispatch } = loadDispatch();
    mockFetch.mockRejectedValueOnce(new TypeError('Failed to fetch'));
    await dispatch();

    const nowSpy = jest.spyOn(Date, 'now').mockReturnValue(Date.now() + 60 * 60 * 1000);
    mockResponse(200);
    await dispatch();

    expect(mockFetch).toHaveBeenCalledTimes(2);
    expect(sentRecordNames(1)).toEqual(['first', 'second']);
    nowSpy.mockRestore();
  });

  it('drops the batch after a non-retryable failure', async () => {
    const { dispatch } = loadDispatch();
    mockResponse(400);
    await dispatch();

    await dispatch();

    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(warnSpy).toHaveBeenCalledTimes(1);
  });

  it('drops pending records without a request while dispatching is disabled', async () => {
    const { dispatch, setDispatchConfig } = loadDispatch({ dispatchingEnabled: false });
    await dispatch();
    expect(mockFetch).not.toHaveBeenCalled();

    setDispatchConfig({ web: true, dispatchingEnabled: true });
    await dispatch();

    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('does not dispatch from a development bundle unless dispatchInDebug is set', async () => {
    const { dispatch, setDispatchBundleDefaults, setDispatchConfig } = loadDispatch();
    setDispatchBundleDefaults({ environment: 'development', isJsDev: true });
    await dispatch();
    expect(mockFetch).not.toHaveBeenCalled();

    mockLogs.push({ timestamp: '2026-09-18T10:00:02.000Z', name: 'third', severity: 'info' });
    setDispatchConfig({ web: true, dispatchInDebug: true });
    mockResponse(200);
    await dispatch();

    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(sentRecordNames()).toEqual(['third']);
  });

  it('never dispatches when this installation is out of sample', async () => {
    const { dispatch } = loadDispatch({ sampleRate: 0 });

    await dispatch();

    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('always dispatches with a sample rate of 1', async () => {
    const { dispatch } = loadDispatch({ sampleRate: 1 });
    mockResponse(200);

    await dispatch();

    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('warns once and sends nothing without an EAS project id', async () => {
    delete mockExpoConfig.extra;
    const { dispatch } = loadDispatch();

    await dispatch();
    await dispatch();

    expect(mockFetch).not.toHaveBeenCalled();
    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(warnSpy.mock.calls[0]![0]).toContain('projectId');
  });

  it('runs concurrent dispatches one after another', async () => {
    const { dispatch } = loadDispatch();
    mockResponse(200);
    mockResponse(200);

    await Promise.all([dispatch(), dispatch()]);

    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('flushes with a keepalive request when the page is hidden', async () => {
    loadDispatch();
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

    // Dispatcher instances from earlier tests still listen too, so only check that a flush happened.
    expect(mockFetch.mock.calls.some((call) => call[1].keepalive === true)).toBe(true);
  });
});
