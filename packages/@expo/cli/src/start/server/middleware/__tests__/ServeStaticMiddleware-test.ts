import { vol } from 'memfs';
import send from 'send';

import { ServeStaticMiddleware } from '../ServeStaticMiddleware';
import { ServerRequest } from '../server.types';

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
    expect(send).not.toBeCalled();

    // Skip to the next middleware
    expect(next).toBeCalled();
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

    expect(send).toBeCalledWith(
      { headers: {}, method: 'GET', url: 'http://localhost:8080/favicon.ico' },
      '/favicon.ico',
      { root: '/public' }
    );

    expect(next).not.toBeCalled();
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
    expect(send).not.toBeCalled();

    // Skip to the next middleware
    expect(next).toBeCalled();
  });
});
