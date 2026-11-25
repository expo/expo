import { PluginError } from '@expo/config-plugins';

import * as Log from '../../../../log';
import { ExpoMiddleware } from '../ExpoMiddleware';
import type { ServerNext, ServerRequest, ServerResponse } from '../server.types';

jest.mock('../../../../log');

const asReq = (req: Partial<ServerRequest>) => req as ServerRequest;

class MockExpoMiddleware extends ExpoMiddleware {
  handleRequestAsync(req: ServerRequest, res: ServerResponse, next: ServerNext): Promise<void> {
    throw new Error('Method not implemented.');
  }
}

describe('shouldHandleRequest', () => {
  const middleware = new MockExpoMiddleware('/', ['/', '/index.html']);
  it('returns false when the request url is not defined', () => {
    expect(middleware.shouldHandleRequest(asReq({}))).toBe(false);
  });

  it('returns false when the request url is not provided', () => {
    expect(middleware.shouldHandleRequest(asReq({ url: '/foo' }))).toBe(false);
  });

  it('returns true when the request url is `/`, or `/index.html`', () => {
    expect(middleware.shouldHandleRequest(asReq({ url: '/' }))).toBe(true);
    expect(middleware.shouldHandleRequest(asReq({ url: '/index.html' }))).toBe(true);
  });

  it('ignores the query and hash of the request url', () => {
    expect(middleware.shouldHandleRequest(asReq({ url: '/?platform=ios' }))).toBe(true);
    expect(middleware.shouldHandleRequest(asReq({ url: '/index.html#hash' }))).toBe(true);
    expect(middleware.shouldHandleRequest(asReq({ url: '/foo?path=/index.html' }))).toBe(false);
  });

  it('matches the pathname of an absolute request url', () => {
    expect(middleware.shouldHandleRequest(asReq({ url: 'http://localhost:8081/' }))).toBe(true);
    expect(
      middleware.shouldHandleRequest(asReq({ url: 'http://localhost:8081/index.html?a=1' }))
    ).toBe(true);
    expect(middleware.shouldHandleRequest(asReq({ url: 'http://localhost:8081/foo' }))).toBe(false);
  });

  it('does not throw for an invalid absolute request url', () => {
    expect(() =>
      middleware.shouldHandleRequest(asReq({ url: 'http://localhost:99999/' }))
    ).not.toThrow();
  });
});

describe('getHandler', () => {
  it(`resolves successfully`, async () => {
    const middleware = new MockExpoMiddleware('/', ['/']);
    middleware.handleRequestAsync = jest.fn();

    const handleAsync = middleware.getHandler();

    const next = jest.fn();

    const res = {
      setHeader: jest.fn(),
      end: jest.fn(),
      statusCode: 200,
    };

    await handleAsync(
      asReq({
        url: '/',
        headers: {
          'expo-dev-client-id': 'client-id',
        },
      }),
      // @ts-expect-error
      res,
      next
    );

    // Internals are invoked.
    expect(middleware.handleRequestAsync).toHaveBeenCalled();

    // Generally tests that the server I/O works as expected so we don't need to test this in subclasses.
    expect(res.statusCode).toEqual(200);
  });

  it(`returns error info in the response`, async () => {
    const middleware = new MockExpoMiddleware('/', ['/']);
    middleware.handleRequestAsync = jest.fn(async () => {
      throw new Error('demo');
    });

    const handleAsync = middleware.getHandler();

    const next = jest.fn();

    const res = {
      setHeader: jest.fn(),
      end: jest.fn(),
      statusCode: 200,
    };

    await handleAsync(
      asReq({
        url: '/',
        headers: {
          'expo-dev-client-id': 'client-id',
        },
      }),
      // @ts-expect-error
      res,
      next
    );

    // Internals are invoked.
    expect(middleware.handleRequestAsync).toHaveBeenCalled();

    // Generally tests that the server I/O works as expected so we don't need to test this in subclasses.
    expect(res.statusCode).toEqual(500);

    expect(next).not.toHaveBeenCalled();
    // Returns error info.
    expect(res.end).toHaveBeenCalledWith(JSON.stringify({ error: 'Error: demo', name: 'Error' }));
    // Ensure the user sees the error in the terminal.
    expect(Log.exception).toHaveBeenCalled();
  });

  it(`returns the error name and code as JSON`, async () => {
    const middleware = new MockExpoMiddleware('/', ['/']);
    middleware.handleRequestAsync = jest.fn(async () => {
      throw new PluginError('Failed to resolve plugin for module "foo"', 'PLUGIN_NOT_FOUND');
    });

    const res = {
      setHeader: jest.fn(),
      end: jest.fn(),
      statusCode: 200,
    };

    await middleware.getHandler()(
      asReq({ url: '/', headers: {} }),
      // @ts-expect-error
      res,
      jest.fn()
    );

    expect(res.statusCode).toEqual(500);
    expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'application/json');
    expect(JSON.parse(res.end.mock.calls[0][0])).toEqual({
      error: 'PluginError: Failed to resolve plugin for module "foo"',
      name: 'PluginError',
      code: 'PLUGIN_NOT_FOUND',
    });
  });

  it(`ends the response without new headers when headers were already sent`, async () => {
    const middleware = new MockExpoMiddleware('/', ['/']);
    middleware.handleRequestAsync = jest.fn(async () => {
      throw new Error('stream failed');
    });

    const res = {
      headersSent: true,
      setHeader: jest.fn(() => {
        throw new Error('Cannot set headers after they are sent to the client');
      }),
      end: jest.fn(),
      statusCode: 200,
    };

    await middleware.getHandler()(
      asReq({ url: '/', headers: {} }),
      // @ts-expect-error
      res,
      jest.fn()
    );

    expect(res.setHeader).not.toHaveBeenCalled();
    expect(res.end).toHaveBeenCalledWith(
      JSON.stringify({ error: 'Error: stream failed', name: 'Error' })
    );
  });

  it(`continues`, async () => {
    const middleware = new MockExpoMiddleware('/', ['/']);
    middleware.handleRequestAsync = jest.fn();
    const handleAsync = middleware.getHandler();

    const next = jest.fn();

    const res = {
      setHeader: jest.fn(),
      end: jest.fn(),
      statusCode: 200,
    };

    await handleAsync(
      asReq({ url: '/foobar', headers: {} }),
      // @ts-expect-error
      res,
      next
    );

    // Generally tests that the server I/O works as expected so we don't need to test this in subclasses.
    expect(res.statusCode).toEqual(200);
    expect(next).toHaveBeenCalled();
    expect(middleware.handleRequestAsync).not.toHaveBeenCalled();
  });
});
