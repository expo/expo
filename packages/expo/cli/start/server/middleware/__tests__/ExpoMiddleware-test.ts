import * as Log from '../../../../log';
import { ExpoMiddleware } from '../ExpoMiddleware';
import { ServerRequest } from '../server.types';

jest.mock('../../../../log');

const asReq = (req: Partial<ServerRequest>) => req as ServerRequest;

const asMock = <T extends (...args: any[]) => any>(fn: T): jest.MockedFunction<T> =>
  fn as jest.MockedFunction<T>;

describe('_shouldContinue', () => {
  const middleware = new ExpoMiddleware('/', ['/', '/index.html']);
  it('returns false when the request url is not defined', () => {
    expect(middleware._shouldContinue(asReq({}))).toBe(false);
  });

  it('returns false when the request url is not provided', () => {
    expect(middleware._shouldContinue(asReq({ url: '/foo' }))).toBe(false);
  });

  it('returns true when the request url is `/`, or `/index.html`', () => {
    expect(middleware._shouldContinue(asReq({ url: '/' }))).toBe(true);
    expect(middleware._shouldContinue(asReq({ url: '/index.html' }))).toBe(true);
  });
});

describe('getHandler', () => {
  it(`resolves successfully`, async () => {
    const middleware = new ExpoMiddleware('/', ['/']);
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
      res,
      next
    );

    // Internals are invoked.
    expect(middleware.handleRequestAsync).toBeCalled();

    // Generally tests that the server I/O works as expected so we don't need to test this in subclasses.
    expect(res.statusCode).toEqual(200);
  });

  it(`returns error info in the response`, async () => {
    const middleware = new ExpoMiddleware('/', ['/']);
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
      res,
      next
    );

    // Internals are invoked.
    expect(middleware.handleRequestAsync).toBeCalled();

    // Generally tests that the server I/O works as expected so we don't need to test this in subclasses.
    expect(res.statusCode).toEqual(520);

    expect(next).not.toBeCalled();
    // Returns error info.
    expect(res.end).toBeCalledWith(JSON.stringify({ error: 'Error: demo' }));
    // Ensure the user sees the error in the terminal.
    expect(Log.error).toBeCalled();
  });

  it(`continues`, async () => {
    const middleware = new ExpoMiddleware('/', ['/']);
    middleware.handleRequestAsync = jest.fn();
    const handleAsync = middleware.getHandler();

    const next = jest.fn();

    const res = {
      setHeader: jest.fn(),
      end: jest.fn(),
      statusCode: 200,
    };

    await handleAsync(asReq({ url: '/foobar', headers: {} }), res, next);

    // Generally tests that the server I/O works as expected so we don't need to test this in subclasses.
    expect(res.statusCode).toEqual(200);
    expect(next).toBeCalled();
    expect(middleware.handleRequestAsync).not.toBeCalled();
  });
});
