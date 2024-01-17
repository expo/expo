import type { ExpoConfig } from '@expo/config';

import { createCorsMiddleware } from '../CorsMiddleware';
import type { ServerNext, ServerRequest, ServerResponse } from '../server.types';

describe(createCorsMiddleware, () => {
  const config: ExpoConfig = { name: 'test', slug: 'test' };
  const middleware = createCorsMiddleware(config);
  const asRequest = (req: Partial<ServerRequest>) => req as ServerRequest;

  let resHeaders: Record<string, string> = {};
  let res: ServerResponse;
  let next: jest.Mock<ServerNext>;

  beforeEach(() => {
    resHeaders = {};
    res = {
      setHeader: (key: string, value: string) => {
        resHeaders[key] = value;
      },
    } as unknown as ServerResponse;
    next = jest.fn();
    jest.resetAllMocks();
  });

  it('should pass through requests without origin', () => {
    middleware(asRequest({ url: 'http://localhost:8081/', headers: {} }), res, next);
    expect(resHeaders['Access-Control-Allow-Origin']).toBeUndefined();
    expect(next).toHaveBeenCalled();
  });

  it('should allow CORS from localhost', () => {
    const origin = 'http://localhost:8082/';
    middleware(asRequest({ url: 'http://localhost:8081/', headers: { origin } }), res, next);
    expect(resHeaders['Access-Control-Allow-Origin']).toBe(origin);
    expect(next).toHaveBeenCalled();
  });

  it('should allow CORS from devtools://devtools', () => {
    const origin = 'devtools://devtools';
    middleware(asRequest({ url: 'http://localhost:8081/', headers: { origin } }), res, next);
    expect(resHeaders['Access-Control-Allow-Origin']).toBe(origin);
    expect(next).toHaveBeenCalled();
  });

  it('should allow CORS from https://chrome-devtools-frontend.appspot.com/', () => {
    const origin = 'https://chrome-devtools-frontend.appspot.com/';
    middleware(asRequest({ url: 'http://localhost:8081/', headers: { origin } }), res, next);
    expect(resHeaders['Access-Control-Allow-Origin']).toBe(origin);
    expect(next).toHaveBeenCalled();
  });

  it(`should allow CORS from expo-router's origin`, () => {
    const origin = 'https://example.org/';
    const middleware = createCorsMiddleware({ ...config, extra: { router: { origin } } });
    middleware(asRequest({ url: 'http://localhost:8081/', headers: { origin } }), res, next);
    expect(resHeaders['Access-Control-Allow-Origin']).toBe(origin);
    expect(next).toHaveBeenCalled();
  });

  it(`should allow CORS from expo-router's headOrigin`, () => {
    const headOrigin = 'https://example.org/';
    const middleware = createCorsMiddleware({ ...config, extra: { router: { headOrigin } } });
    middleware(
      asRequest({ url: 'http://localhost:8081/', headers: { origin: headOrigin } }),
      res,
      next
    );
    expect(resHeaders['Access-Control-Allow-Origin']).toBe(headOrigin);
    expect(next).toHaveBeenCalled();
  });

  it(`should allow CORS from expo-router's origin to a full URL request`, () => {
    // Though browsers don't send the full URL in the Origin header, we should support it
    const origin = 'https://example.org/foo/bar?alpha=beta#gamma';
    const middleware = createCorsMiddleware({ ...config, extra: { router: { origin } } });
    middleware(
      asRequest({ url: 'http://localhost:8081/foo/bar?alpha=beta#gamma', headers: { origin } }),
      res,
      next
    );
    expect(resHeaders['Access-Control-Allow-Origin']).toBe(origin);
    expect(next).toHaveBeenCalled();
  });

  it('should prevent metro reset the hardcoded CORS header', () => {
    const origin = 'http://localhost:8082/';
    middleware(
      asRequest({ url: 'http://localhost:8081/index.map', headers: { origin } }),
      res,
      next
    );
    // Simulate metro to reset the hardcoded CORS header
    res.setHeader('Access-Control-Allow-Origin', 'devtools://devtools');

    expect(resHeaders['Access-Control-Allow-Origin']).toBe(origin);
    expect(next).toHaveBeenCalled();
  });

  it('should show explicit error from disallowed CORS', () => {
    const origin = 'https://example.org/';
    middleware(asRequest({ url: 'http://localhost:8081/', headers: { origin } }), res, next);
    expect(resHeaders['Access-Control-Allow-Origin']).toBeUndefined();
    expect(next).toHaveBeenCalled();
    expect(next.mock.calls[0][0]).toBeInstanceOf(Error);
  });

  it('should show explicit error from disallowed CORS to a full URL request', () => {
    // Though browsers don't send the full URL in the Origin header, we should support it
    const origin = 'https://example.org/foo/bar?alpha=beta#gamma';
    middleware(
      asRequest({ url: 'http://localhost:8081/foo/bar?alpha=beta#gamma', headers: { origin } }),
      res,
      next
    );
    expect(resHeaders['Access-Control-Allow-Origin']).toBeUndefined();
    expect(next).toHaveBeenCalled();
    expect(next.mock.calls[0][0]).toBeInstanceOf(Error);
  });

  it('Advanced CORS like preflight requests are not supported', () => {
    const origin = 'http://localhost:8082/';
    middleware(
      asRequest({
        url: 'http://localhost:8081/',
        headers: { origin, 'Access-Control-Request-Method': 'DELETE' },
        method: 'OPTIONS',
      }),
      res,
      next
    );
    expect(resHeaders['Access-Control-Allow-Origin']).toBe(origin);
    expect(resHeaders['Access-Control-Allow-Methods']).toBeUndefined();
    expect(next).toHaveBeenCalled();
  });
});
