import { HistoryFallbackMiddleware } from '../HistoryFallbackMiddleware';
import { ServerRequest } from '../server.types';

const asRequest = (req: Partial<ServerRequest>) => req as ServerRequest;

it(`redirects to provided middleware on web with query parameter`, () => {
  const indexMiddleware = jest.fn();
  const middleware = new HistoryFallbackMiddleware(indexMiddleware).getHandler();

  const next = jest.fn();
  middleware(
    asRequest({
      url: 'https://localhost:8081/foobar?platform=web',
      headers: {},
    }),
    {} as any,
    next
  );
  // Redirects to middleware with URL intact.
  expect(indexMiddleware).toBeCalledTimes(1);
  expect(indexMiddleware).toBeCalledWith(
    expect.objectContaining({
      url: 'https://localhost:8081/foobar?platform=web',
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
      url: 'https://localhost:8081/foobar',
      headers: {},
    }),
    {} as any,
    next
  );
  // Redirects to middleware with URL intact.
  expect(indexMiddleware).toBeCalledTimes(1);
  expect(indexMiddleware).toBeCalledWith(
    expect.objectContaining({
      url: 'https://localhost:8081/foobar',
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
      url: 'https://localhost:8081/foobar',
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
