import { ExpoConfig } from '@expo/config';
import { Middleware } from 'metro-config';

import { createFlipperTelemetryMiddleware, findDebugTool } from '../metroFlipperMiddleware';
import { logEventAsync } from '../rudderstackClient';

jest.mock('../rudderstackClient');

const fakeExpoConfig = {
  sdkVersion: '47.0.0',
  jsEngine: 'hermes',
} as ExpoConfig;

describe(findDebugTool, () => {
  it('returns flipper from user agent', () => {
    expect(findDebugTool('Flipper/0.107.0')).toMatchObject({
      name: 'flipper',
      version: '0.107.0',
    });
  });
});

describe(createFlipperTelemetryMiddleware, () => {
  type MiddlewareRequest = Parameters<Middleware>[0];
  type MiddlewareResponse = Parameters<Middleware>[1];

  it('reports known tool from user agent', () => {
    const middleware = createFlipperTelemetryMiddleware('/fake-project', fakeExpoConfig);
    run(middleware, { url: '/json', userAgent: 'Flipper/0.107.0' });
    expect(logEventAsync).toHaveBeenCalledWith(
      'metro debug',
      expect.objectContaining({
        toolName: 'flipper',
        toolVersion: '0.107.0',
      })
    );
  });

  it('only reports known tool once', () => {
    const middleware = createFlipperTelemetryMiddleware('/fake-project', fakeExpoConfig);
    run(middleware, { url: '/json', userAgent: 'Flipper/0.107.0' });
    run(middleware, { url: '/json', userAgent: 'Flipper/0.107.0' });
    expect(logEventAsync).toHaveBeenCalledTimes(1);
  });

  it('does not report with unknown user agent', () => {
    const middleware = createFlipperTelemetryMiddleware('/fake-project', fakeExpoConfig);
    run(middleware, { url: '/json', userAgent: 'unknown/0.107.0' });
    expect(logEventAsync).not.toHaveBeenCalled();
  });

  it('does not report on other endpoint than /json(...)', () => {
    const middleware = createFlipperTelemetryMiddleware('/fake-project', fakeExpoConfig);
    run(middleware, { url: '/other', userAgent: 'Flipper/0.107.0' });
    expect(logEventAsync).not.toHaveBeenCalled();
  });

  it('does not report when telemetry is turned off', () => {
    process.env.EXPO_NO_TELEMETRY = 'true';

    const middleware = createFlipperTelemetryMiddleware('/fake-project', fakeExpoConfig);
    run(middleware, { url: '/json', userAgent: 'Flipper/0.107.0' });
    expect(logEventAsync).not.toHaveBeenCalled();

    delete process.env.EXPO_NO_TELEMETRY;
  });

  it('does not report when app is not using hermes', () => {
    const expoConfig = { ...fakeExpoConfig, jsEngine: 'jsc' as const };
    const middleware = createFlipperTelemetryMiddleware('/fake-project', expoConfig);
    run(middleware, { url: '/json', userAgent: 'Flipper/0.107.0' });
    expect(logEventAsync).not.toHaveBeenCalled();
  });

  /** Test the middleware with a `next` spy, fake request with user agent, and an empty response */
  function run(middleware: Middleware, reqOptions: { userAgent?: string; url?: string }) {
    const next = jest.fn();
    const response = {} as MiddlewareResponse;
    const request = {
      headers: { 'user-agent': reqOptions.userAgent },
      url: reqOptions.url,
    } as MiddlewareRequest;

    middleware(request, response, next);

    return { request, response, next };
  }
});
