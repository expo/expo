import { vol } from 'memfs';
import send from 'send';

import { ServeStaticMiddleware } from '../ServeStaticMiddleware';
import type { ServerRequest } from '../server.types';

beforeEach(() => vol.reset());

const asReq = (req: Partial<ServerRequest>) => req as ServerRequest;
jest.mock('send', () => jest.fn(() => ({ on: jest.fn(), pipe: jest.fn() })));

describe('getHandler', () => {
  vol.fromJSON(
    {
      '/public/favicon.ico': '...',
    },
    '/'
  );

  const middleware = new ServeStaticMiddleware('/').getHandler();

  it(`skips serving for non GET requests`, async () => {
    const next = jest.fn();

    middleware(
      asReq({
        url: 'http://localhost:8080/favicon.ico',
        method: 'PUT',
        headers: {},
      }),
      {} as any,
      next
    );

    // Not called
    expect(send).not.toHaveBeenCalled();

    // Skip to the next middleware
    expect(next).toHaveBeenCalled();
  });

  it(`serves static content from the public folder`, async () => {
    const next = jest.fn();

    middleware(
      asReq({
        url: 'http://localhost:8080/favicon.ico',
        method: 'GET',
        headers: {},
      }),
      {} as any,
      next
    );

    expect(send).toHaveBeenCalledWith(
      { headers: {}, method: 'GET', url: 'http://localhost:8080/favicon.ico' },
      '/favicon.ico',
      { root: '/public' }
    );

    expect(next).not.toHaveBeenCalled();
  });

  it(`serves static content without the query of the request url`, async () => {
    const next = jest.fn();
    const req = asReq({ url: '/favicon.ico?v=1#hash', method: 'GET', headers: {} });

    middleware(req, {} as any, next);

    expect(send).toHaveBeenCalledWith(req, '/favicon.ico', { root: '/public' });
    expect(next).not.toHaveBeenCalled();
  });

  it(`does not throw for an invalid absolute request url`, async () => {
    const next = jest.fn();
    const req = asReq({ url: 'http://localhost:99999/favicon.ico', method: 'GET', headers: {} });

    expect(() => middleware(req, {} as any, next)).not.toThrow();
  });

  // NOTE(EvanBacon): We could change this in the future.
  it(`does not serve static content from the public folder on native`, async () => {
    const next = jest.fn();

    middleware(
      asReq({
        url: 'http://localhost:8080/favicon.ico',
        method: 'GET',
        headers: {
          'expo-platform': 'ios',
        },
      }),
      {} as any,
      next
    );

    // Not called
    expect(send).not.toHaveBeenCalled();

    // Skip to the next middleware
    expect(next).toHaveBeenCalled();
  });
});
