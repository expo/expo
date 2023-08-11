import { ExpoConfig } from '@expo/config';
import { Middleware } from 'metro-config';

import { createDebuggerTelemetryMiddleware, findDebugTool } from '../metroDebuggerMiddleware';
import { logEventAsync } from '../rudderstackClient';

jest.mock('../getMetroDebugProperties');
jest.mock('../rudderstackClient');

const FLIPPER_UA = `Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Flipper/0.177.0 Chrome/100.0.4896.143 Electron/18.2.0 Safari/537.36`;
const CHROME_ORIGIN = `https://chrome-devtools-frontend.appspot.com`;

const fakeExpoConfig = {
  sdkVersion: '47.0.0',
  jsEngine: 'hermes',
} as ExpoConfig;

/** Create a fake request object, based on the provided options */
const req = (options: { url: string; userAgent?: string; origin?: string }) =>
  ({
    url: options.url,
    headers: {
      'user-agent': options.userAgent,
      origin: options.origin,
    },
  }) as Parameters<Middleware>[0];

describe(findDebugTool, () => {
  it('returns flipper from user agent', () => {
    expect(findDebugTool(req({ url: '/json', userAgent: FLIPPER_UA }))).toMatchObject({
      name: 'flipper',
      version: '0.177.0',
    });
  });

  it('returns chrome from origin', () => {
    expect(findDebugTool(req({ url: '/index.map', origin: CHROME_ORIGIN }))).toMatchObject({
      name: 'chrome',
    });
  });
});

describe(createDebuggerTelemetryMiddleware, () => {
  it('reports known tool from user agent', () => {
    const middleware = createDebuggerTelemetryMiddleware('/fake-project', fakeExpoConfig);
    const next = jest.fn();

    middleware(req({ url: '/json', userAgent: FLIPPER_UA }), {} as any, next);

    expect(logEventAsync).toHaveBeenCalled();
  });

  it('only reports known tool once', () => {
    const middleware = createDebuggerTelemetryMiddleware('/fake-project', fakeExpoConfig);
    const next = jest.fn();

    middleware(req({ url: '/json', userAgent: FLIPPER_UA }), {} as any, next);
    middleware(req({ url: '/json', userAgent: FLIPPER_UA }), {} as any, next);

    expect(logEventAsync).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledTimes(2);
  });

  it('does not report with unknown user agent', () => {
    const middleware = createDebuggerTelemetryMiddleware('/fake-project', fakeExpoConfig);
    const next = jest.fn();

    middleware(req({ url: '/json', userAgent: 'unknown/4.2.0' }), {} as any, next);

    expect(logEventAsync).not.toHaveBeenCalled();
  });

  it('does not report when telemetry is turned off', () => {
    process.env.EXPO_NO_TELEMETRY = 'true';

    const middleware = createDebuggerTelemetryMiddleware('/fake-project', fakeExpoConfig);
    const next = jest.fn();

    middleware(req({ url: '/json', userAgent: FLIPPER_UA }), {} as any, next);

    expect(logEventAsync).not.toHaveBeenCalled();

    delete process.env.EXPO_NO_TELEMETRY;
  });

  it('does not report when app is not using hermes', () => {
    const expoConfig = { ...fakeExpoConfig, jsEngine: 'jsc' as const };
    const middleware = createDebuggerTelemetryMiddleware('/fake-project', expoConfig);
    const next = jest.fn();

    middleware(req({ url: '/json', userAgent: FLIPPER_UA }), {} as any, next);

    expect(logEventAsync).not.toHaveBeenCalled();
  });
});
