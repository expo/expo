import { FingerprintMiddleware, FingerprintMiddlewareOptions } from '../FingerprintMiddleware';
import type { ServerRequest, ServerResponse } from '../server.types';

const asReq = (req: Partial<ServerRequest>) => ({ headers: {}, ...req }) as ServerRequest;

function createMockResponse() {
  return {
    setHeader: jest.fn(),
    end: jest.fn(),
    statusCode: 0,
  } as unknown as ServerResponse;
}

const serverFingerprint = { hash: 'server-hash', fingerprintVersion: '0.20.6', sources: [] };

function createMiddleware(overrides: Partial<FingerprintMiddlewareOptions> = {}) {
  const getFingerprintAsync =
    overrides.getFingerprintAsync ?? jest.fn(async () => serverFingerprint);
  const recordClientFingerprint = overrides.recordClientFingerprint ?? jest.fn(() => null);
  const middleware = new FingerprintMiddleware('/', {
    getFingerprintAsync,
    recordClientFingerprint,
  });
  return { middleware, getFingerprintAsync, recordClientFingerprint };
}

function parseBody(res: ServerResponse) {
  return JSON.parse(jest.mocked(res.end).mock.calls[0]![0] as string);
}

describe(FingerprintMiddleware, () => {
  it.each([
    ['a platform query', { url: '/_expo/fingerprint?platform=ios' }],
    [
      'the expo-platform header',
      { url: '/_expo/fingerprint', headers: { 'expo-platform': 'ios' } },
    ],
  ])(`returns the fingerprint for %s`, async (_description, request) => {
    const { middleware, getFingerprintAsync } = createMiddleware();
    const res = createMockResponse();
    await middleware.handleRequestAsync(asReq({ method: 'GET', ...request }), res);
    expect(res.statusCode).toBe(200);
    expect(parseBody(res)).toEqual({
      platform: 'ios',
      hash: 'server-hash',
      fingerprintVersion: '0.20.6',
    });
    expect(getFingerprintAsync).toHaveBeenCalledWith('ios');
  });

  it.each([
    ['a missing platform', '/_expo/fingerprint', 'MISSING_PLATFORM'],
    ['an unsupported platform', '/_expo/fingerprint?platform=web', 'INVALID_PLATFORM'],
  ])(`rejects %s`, async (_description, url, code) => {
    const { middleware } = createMiddleware();
    const res = createMockResponse();
    await middleware.handleRequestAsync(asReq({ method: 'GET', url }), res);
    expect(res.statusCode).toBe(400);
    expect(parseBody(res).code).toBe(code);
  });

  it(`responds 503 when the fingerprint is unavailable`, async () => {
    const { middleware } = createMiddleware({
      getFingerprintAsync: jest.fn(async () => null),
    });
    const res = createMockResponse();
    await middleware.handleRequestAsync(
      asReq({ method: 'GET', url: '/_expo/fingerprint?platform=ios' }),
      res
    );
    expect(res.statusCode).toBe(503);
    expect(parseBody(res).code).toBe('FINGERPRINT_UNAVAILABLE');
  });

  it(`rejects non-GET methods with Allow`, async () => {
    const { middleware, getFingerprintAsync } = createMiddleware();
    const res = createMockResponse();
    await middleware.handleRequestAsync(
      asReq({ method: 'POST', url: '/_expo/fingerprint?platform=ios' }),
      res
    );
    expect(res.statusCode).toBe(405);
    expect(res.setHeader).toHaveBeenCalledWith('Allow', 'GET, HEAD');
    expect(getFingerprintAsync).not.toHaveBeenCalled();
  });

  it(`records an announced fingerprint`, async () => {
    const { middleware, recordClientFingerprint } = createMiddleware();
    const res = createMockResponse();
    await middleware.handleRequestAsync(
      asReq({
        method: 'GET',
        url: '/_expo/fingerprint?platform=ios',
        headers: { 'expo-fingerprint': 'embedded-hash' },
      }),
      res
    );
    expect(recordClientFingerprint).toHaveBeenCalledWith('ios', 'embedded-hash', serverFingerprint);
    expect(res.statusCode).toBe(200);
    // A matching announce produces no advice, so the response must not carry a mismatch key.
    expect(parseBody(res)).not.toHaveProperty('mismatch');
  });

  it(`returns the mismatch advice when the announced fingerprint is stale`, async () => {
    const advice = {
      recommendation: 'The installed ios app does not match the project.',
      commands: ['npx expo prebuild -p ios', 'npx expo run:ios'],
    };
    const { middleware } = createMiddleware({
      recordClientFingerprint: jest.fn(() => advice),
    });
    const res = createMockResponse();
    await middleware.handleRequestAsync(
      asReq({
        method: 'GET',
        url: '/_expo/fingerprint?platform=ios',
        headers: { 'expo-fingerprint': 'stale-hash' },
      }),
      res
    );
    expect(res.statusCode).toBe(200);
    expect(parseBody(res)).toEqual({
      platform: 'ios',
      hash: 'server-hash',
      fingerprintVersion: '0.20.6',
      mismatch: advice,
    });
  });

  it(`does not record without the announce header`, async () => {
    const { middleware, recordClientFingerprint } = createMiddleware();
    const res = createMockResponse();
    await middleware.handleRequestAsync(
      asReq({ method: 'GET', url: '/_expo/fingerprint?platform=ios' }),
      res
    );
    expect(recordClientFingerprint).not.toHaveBeenCalled();
  });
});
