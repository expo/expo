/** @jest-environment jsdom */

import type { RedirectConfig } from '../exports';
import { renderRouter, screen } from '../testing-library';

const mockRedirects = jest.fn(() => [] as RedirectConfig[]);
const mockRewrites = jest.fn(() => [] as RedirectConfig[]);

jest.mock('expo-constants', () => {
  const original = jest.requireActual('expo-constants');
  return {
    ...original,
    expoConfig: {
      extra: {
        router: {
          get redirects() {
            return mockRedirects();
          },
          get rewrites() {
            return mockRewrites();
          },
        },
      },
    },
  };
});

beforeEach(() => {
  mockRedirects.mockReturnValue([]);
  mockRewrites.mockReturnValue([]);
});

it('redirects a static page to the matching dynamic segment', async () => {
  mockRedirects.mockReturnValue([
    {
      source: '/old/[id]',
      destination: '/new/[id]',
    } as RedirectConfig,
  ]);

  const result = await renderRouter(
    {
      index: () => null,
      'new/[id]': () => null,
    },
    { initialUrl: '/old/abc' }
  );

  try {
    expect(screen).toHavePathname('/new/abc');
  } finally {
    await result.unmount();
    jest.useRealTimers();
  }
});

it('redirects a three-segment static page to an absolute path', async () => {
  mockRedirects.mockReturnValue([
    {
      source: '/browse/products/[productId]',
      destination: '/products/[productId]',
    } as RedirectConfig,
  ]);

  const result = await renderRouter(
    {
      index: () => null,
      'products/[productId]': () => null,
    },
    { initialUrl: '/browse/products/sku-1' }
  );

  try {
    expect(screen).toHavePathname('/products/sku-1');
  } finally {
    await result.unmount();
    jest.useRealTimers();
  }
});

it('keeps the query string on a static redirect page', async () => {
  mockRedirects.mockReturnValue([
    {
      source: '/old/[id]',
      destination: '/new/[id]',
    } as RedirectConfig,
  ]);

  const result = await renderRouter(
    {
      index: () => null,
      'new/[id]': () => null,
    },
    { initialUrl: '/old/abc?utm_source=x' }
  );

  try {
    expect(screen).toHavePathnameWithParams('/new/abc?utm_source=x');
  } finally {
    await result.unmount();
    jest.useRealTimers();
  }
});
