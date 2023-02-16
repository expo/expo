import { HistoryFallbackMiddleware, isInspectorProxyRequest } from '../HistoryFallbackMiddleware';
import { ServerRequest } from '../server.types';

const asRequest = (req: Partial<ServerRequest>) => req as ServerRequest;

describe(isInspectorProxyRequest, () => {
  it(`return true for no UA + known inspector endpoint`, () => {
    expect(
      isInspectorProxyRequest(
        asRequest({
          url: '/inspector/debug',
          headers: {},
        })
      )
    ).toBe(true);
  });
  it(`return true for node-fetch user-agent + known inspector endpoint`, () => {
    expect(
      isInspectorProxyRequest(
        asRequest({
          url: '/json/list',
          headers: {
            'user-agent': 'node-fetch',
          },
        })
      )
    ).toBe(true);
  });
  it(`return false for browser user-agent + known inspector endpoint`, () => {
    expect(
      isInspectorProxyRequest(
        asRequest({
          url: '/json/list',
          headers: {
            'user-agent':
              'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/109.0.0.0 Safari/537.36',
          },
        })
      )
    ).toBe(false);
  });
});

it(`skips requests to the Metro inspector proxy`, () => {
  const indexMiddleware = jest.fn();
  const middleware = new HistoryFallbackMiddleware(indexMiddleware).getHandler();

  const next = jest.fn();
  middleware(
    asRequest({
      url: '/json/list',
      headers: {
        'user-agent': 'node-fetch',
      },
    }),
    {} as any,
    next
  );
  // Redirects to middleware with URL intact.
  expect(indexMiddleware).toBeCalledTimes(0);
  expect(next).toBeCalledTimes(1);
});

it(`redirects to provided middleware on web with query parameter`, () => {
  const indexMiddleware = jest.fn();
  const middleware = new HistoryFallbackMiddleware(indexMiddleware).getHandler();

  const next = jest.fn();
  middleware(
    asRequest({
      url: 'https://localhost:19000/foobar?platform=web',
      headers: {},
    }),
    {} as any,
    next
  );
  // Redirects to middleware with URL intact.
  expect(indexMiddleware).toBeCalledTimes(1);
  expect(indexMiddleware).toBeCalledWith(
    expect.objectContaining({
      url: 'https://localhost:19000/foobar?platform=web',
    }),
    {},
    expect.anything()
  );
  // Next is not called...
  expect(next).toBeCalledTimes(0);
});

// NOTE(EvanBacon): The default behavior of the HistoryFallbackMiddleware is to redirect to the index.html
// this is because a browser does not have custom native code loading like an Expo runtime does.
it(`redirects to provided middleware on web with no indication of a custom platform`, () => {
  const indexMiddleware = jest.fn();
  const middleware = new HistoryFallbackMiddleware(indexMiddleware).getHandler();

  const next = jest.fn();
  middleware(
    asRequest({
      url: 'https://localhost:19000/foobar',
      headers: {},
    }),
    {} as any,
    next
  );
  // Redirects to middleware with URL intact.
  expect(indexMiddleware).toBeCalledTimes(1);
  expect(indexMiddleware).toBeCalledWith(
    expect.objectContaining({
      url: 'https://localhost:19000/foobar',
    }),
    {},
    expect.anything()
  );
  // Next is not called...
  expect(next).toBeCalledTimes(0);
});

// NOTE(EvanBacon): I can see this potentially changing in the future, React Suspense + React Navigation is a good example.
it(`does not redirect on native`, () => {
  const indexMiddleware = jest.fn();
  const middleware = new HistoryFallbackMiddleware(indexMiddleware).getHandler();

  const next = jest.fn();
  middleware(
    asRequest({
      url: 'https://localhost:19000/foobar',
      headers: { 'expo-platform': 'android' },
    }),
    {} as any,
    next
  );

  // Does not redirect
  expect(indexMiddleware).toBeCalledTimes(0);

  // Move on to the next middleware
  expect(next).toBeCalledTimes(1);
});
