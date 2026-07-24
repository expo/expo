import { vol } from 'memfs';

import { FaviconMiddleware } from '../FaviconMiddleware';
import type { ServerRequest, ServerResponse } from '../server.types';

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

  expect(next).toHaveBeenCalledTimes(1);
  expect(next).toHaveBeenCalledWith();
  expect(res.end).toHaveBeenCalledTimes(0);
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
  expect(next).toHaveBeenCalledTimes(1);
  expect(next).toHaveBeenCalledWith();
  expect(res.end).toHaveBeenCalledTimes(0);
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
  expect(next).toHaveBeenCalledTimes(0);
  expect(res.end).toHaveBeenCalledTimes(1);
  expect(res.end).toHaveBeenCalledWith(Buffer.from('...'));
  expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'image/x-icon');
});

it(`serves an SVG favicon with the SVG MIME type`, async () => {
  const svg = '<svg xmlns="http://www.w3.org/2000/svg"/>';
  vol.fromJSON(
    {
      'assets/favicon.svg': svg,
      'package.json': JSON.stringify({}),
      'app.json': JSON.stringify({
        sdkVersion: '49.0.0',
        web: { favicon: './assets/favicon.svg' },
      }),
    },
    '/'
  );

  const middleware = new FaviconMiddleware('/').getHandler();

  const res = getMockRes();
  const next = jest.fn();
  await middleware(
    asRequest({ url: '/favicon.svg', method: 'GET' }),
    res,
    next
  );

  expect(next).toHaveBeenCalledTimes(0);
  expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'image/svg+xml');
  expect(res.end).toHaveBeenCalledTimes(1);
  expect((res.end as jest.Mock).mock.calls[0][0].toString()).toBe(svg);
});

it(`falls through /favicon.svg when web.favicon is a raster image`, async () => {
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
    asRequest({ url: '/favicon.svg', method: 'GET' }),
    res,
    next
  );

  // Configured format is ICO; request was for SVG — pass through so the
  // static middleware can serve a hand-crafted SVG if the user provides one.
  expect(next).toHaveBeenCalledTimes(1);
  expect(next).toHaveBeenCalledWith();
  expect(res.end).toHaveBeenCalledTimes(0);
});

it(`falls through /favicon.ico when web.favicon is an SVG`, async () => {
  vol.fromJSON(
    {
      'assets/favicon.svg': '<svg/>',
      'package.json': JSON.stringify({}),
      'app.json': JSON.stringify({
        sdkVersion: '49.0.0',
        web: { favicon: './assets/favicon.svg' },
      }),
    },
    '/'
  );

  const middleware = new FaviconMiddleware('/').getHandler();

  const res = getMockRes();
  const next = jest.fn();
  await middleware(
    asRequest({ url: '/favicon.ico', method: 'GET' }),
    res,
    next
  );

  // Configured format is SVG; old browsers asking for /favicon.ico fall
  // through so a hand-crafted `public/favicon.ico` can serve as fallback.
  expect(next).toHaveBeenCalledTimes(1);
  expect(next).toHaveBeenCalledWith();
  expect(res.end).toHaveBeenCalledTimes(0);
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

  expect(next).toHaveBeenCalledTimes(1);
  expect(next).toHaveBeenCalledWith();
});
