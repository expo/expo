import { vol } from 'memfs';

import { FaviconMiddleware } from '../FaviconMiddleware';
import { ServerRequest, ServerResponse } from '../server.types';

const asRequest = (req: Partial<ServerRequest>) => req as ServerRequest;

beforeEach(() => vol.reset());

function getMockRes() {
  return {
    end: jest.fn(),
    setHeader: jest.fn(),
  } as unknown as ServerResponse;
}

it(`skips when favicon request is invalid`, async () => {
  vol.fromJSON(
    {
      '/package.json': JSON.stringify({}),
      '/app.json': JSON.stringify({ sdkVersion: '49.0.0' }),
      '/public/favicon.ico': '...',
    },
    '/'
  );

  const middleware = new FaviconMiddleware('/').getHandler();

  const res = getMockRes();
  const next = jest.fn();
  await middleware(
    asRequest({
      url: '/favicon.ico',
      // THIS IS THE DIFFERENCE
      method: 'POST',
    }),
    res,
    next
  );

  expect(next).toBeCalledTimes(1);
  expect(next).toBeCalledWith();
  expect(res.end).toBeCalledTimes(0);
});

it(`skips when user-defined favicon is used`, async () => {
  vol.fromJSON(
    {
      '/package.json': JSON.stringify({}),
      '/app.json': JSON.stringify({ sdkVersion: '49.0.0' }),
      '/public/favicon.ico': '...',
    },
    '/'
  );

  const middleware = new FaviconMiddleware('/').getHandler();

  const res = getMockRes();
  const next = jest.fn();
  await middleware(
    asRequest({
      url: '/favicon.ico',
      method: 'GET',
    }),
    res,
    next
  );

  // Falls back on the serve static middleware.
  expect(next).toBeCalledTimes(1);
  expect(next).toBeCalledWith();
  expect(res.end).toBeCalledTimes(0);
});

it(`generates a favicon from Expo config`, async () => {
  vol.fromJSON(
    {
      'assets/favicon.png': '...',
      'package.json': JSON.stringify({}),
      'app.json': JSON.stringify({
        sdkVersion: '49.0.0',
        web: { favicon: './assets/favicon.png' },
      }),
    },
    '/'
  );

  const middleware = new FaviconMiddleware('/').getHandler();

  const res = getMockRes();
  const next = jest.fn();
  await middleware(
    asRequest({
      url: '/favicon.ico',
      method: 'GET',
    }),
    res,
    next
  );

  // Falls back on the serve static middleware.
  expect(next).toBeCalledTimes(0);
  expect(res.end).toBeCalledTimes(1);
  expect(res.end).toBeCalledWith(Buffer.from('...'));
});

it(`fails when favicon from Expo config is invalid`, async () => {
  vol.fromJSON(
    {
      // Missing file
      //   'assets/favicon.png': '...',
      'package.json': JSON.stringify({}),
      'app.json': JSON.stringify({
        sdkVersion: '49.0.0',
        web: { favicon: './assets/favicon.png' },
      }),
    },
    '/'
  );

  const middleware = new FaviconMiddleware('/').getHandler();

  const res = getMockRes();
  const next = jest.fn();
  await middleware(
    asRequest({
      url: '/favicon.ico',
      method: 'GET',
    }),
    res,
    next
  );

  expect(next).toBeCalledTimes(1);
  expect(next).toBeCalledWith(expect.any(Error));
});
