import { screen, act, fireEvent } from '@testing-library/react-native';
import { use } from 'react';
import { Text } from 'react-native';

import type { RedirectConfig } from '../exports';
import { router } from '../exports';
import type { StoreRedirects } from '../global-state/router-store';
import { store } from '../global-state/router-store';
import { StoreContext } from '../global-state/storeContext';
import Stack from '../layouts/Stack';
import { Tabs } from '../layouts/Tabs';
import { renderRouter } from '../testing-library';
import { expectCompleteStateToMatch } from './assertCompleteState';

const mockRedirects = jest.fn(() => [] as RedirectConfig[]);
const mockRewrites = jest.fn(() => [] as RedirectConfig[]);
const mockOpenURL = jest.fn((url: string) => undefined);

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

jest.mock('expo-linking', () => {
  return {
    ...jest.requireActual('expo-linking'),
    get openURL() {
      return (url: string) => mockOpenURL(url);
    },
  };
});

it('exposes redirects and rewrites through the store context', () => {
  const redirect = { source: '/foo', destination: '/bar' } as RedirectConfig;
  const externalRedirect = { source: '/away', destination: '//example.com' } as RedirectConfig;
  const rewrite = { source: '/old', destination: '/new' } as RedirectConfig;
  mockRedirects.mockReturnValue([redirect, externalRedirect]);
  mockRewrites.mockReturnValue([rewrite]);

  let contextRedirects: StoreRedirects[] | undefined;

  function Index() {
    contextRedirects = use(StoreContext)!.redirects;
    return null;
  }

  renderRouter({
    index: Index,
    bar: () => null,
    new: () => null,
  });

  expect(contextRedirects).toEqual([
    [expect.any(RegExp), redirect, false],
    [expect.any(RegExp), externalRedirect, true],
    [expect.any(RegExp), rewrite, false],
  ]);
});

it('deep link to a redirect', () => {
  mockRedirects.mockReturnValue([
    {
      source: '/foo',
      destination: '/bar',
    } as RedirectConfig,
  ]);

  renderRouter(
    {
      index: () => null,
      bar: () => <Text testID="bar" />,
    },
    {
      initialUrl: '/foo',
    }
  );

  expect(screen.getByTestId('bar')).toBeTruthy();

  expectCompleteStateToMatch(store.state, {
    index: 0,
    key: expect.any(String),
    routeNames: ['__root', '+not-found', '_sitemap'],
    routes: [
      {
        key: expect.any(String),
        name: '__root',
        state: {
          index: 0,
          key: expect.any(String),
          routeNames: ['index', 'bar', 'foo'],
          routes: [
            {
              key: expect.any(String),
              name: 'bar',
              path: '/bar',
            },
          ],
          stale: false,
          routeKeySeq: expect.any(Number),
        },
      },
    ],
    stale: false,
    routeKeySeq: expect.any(Number),
  });
});

it('deep link to a dynamic redirect', () => {
  mockRedirects.mockReturnValue([
    {
      source: '/foo/[slug]',
      destination: 'deeply/nested/route/[slug]',
    } as RedirectConfig,
  ]);

  renderRouter(
    {
      index: () => null,
      'deeply/nested/route/[slug]': () => <Text testID="nested" />,
    },
    {
      initialUrl: '/foo/bar',
    }
  );

  expectCompleteStateToMatch(store.state, {
    index: 0,
    key: expect.any(String),
    routeNames: ['__root', '+not-found', '_sitemap'],
    routes: [
      {
        key: expect.any(String),
        name: '__root',
        params: {
          slug: 'bar',
        },
        state: {
          index: 0,
          key: expect.any(String),
          routeNames: ['index', 'deeply/nested/route/[slug]', 'foo/[slug]'],
          routes: [
            {
              key: expect.any(String),
              name: 'deeply/nested/route/[slug]',
              params: {
                slug: 'bar',
              },
              path: '/deeply/nested/route/bar',
            },
          ],
          stale: false,
          routeKeySeq: expect.any(Number),
        },
      },
    ],
    stale: false,
    routeKeySeq: expect.any(Number),
  });
});

it('keeps extra params as query params', () => {
  mockRedirects.mockReturnValue([
    {
      source: '/foo/[slug]',
      destination: '/bar',
    } as RedirectConfig,
  ]);

  renderRouter(
    {
      index: () => null,
      bar: () => <Text testID="bar" />,
    },
    {
      initialUrl: '/foo/hello?extra=param',
    }
  );

  expectCompleteStateToMatch(store.state, {
    index: 0,
    key: expect.any(String),
    routeNames: ['__root', '+not-found', '_sitemap'],
    routes: [
      {
        key: expect.any(String),
        name: '__root',
        state: {
          index: 0,
          key: expect.any(String),
          routeNames: ['index', 'bar', 'foo/[slug]'],
          routes: [
            {
              key: expect.any(String),
              name: 'bar',
              path: '/bar',
            },
          ],
          stale: false,
          routeKeySeq: expect.any(Number),
        },
      },
    ],
    stale: false,
    routeKeySeq: expect.any(Number),
  });
});

it('can redirect from single to catch all', () => {
  mockRedirects.mockReturnValue([
    {
      source: '/foo/[slug]',
      destination: 'bar/[...slug]',
    } as RedirectConfig,
  ]);

  renderRouter(
    {
      index: () => null,
      'bar/[...slug]': () => <Text testID="bar" />,
    },
    {
      initialUrl: '/foo/bar',
    }
  );

  expectCompleteStateToMatch(store.state, {
    index: 0,
    key: expect.any(String),
    routeNames: ['__root', '+not-found', '_sitemap'],
    routes: [
      {
        key: expect.any(String),
        name: '__root',
        params: {
          slug: ['bar'],
        },
        state: {
          index: 0,
          key: expect.any(String),
          routeNames: ['index', 'foo/[slug]', 'bar/[...slug]'],
          routes: [
            {
              key: expect.any(String),
              name: 'bar/[...slug]',
              params: {
                slug: ['bar'],
              },
              path: '/bar/bar',
            },
          ],
          stale: false,
          routeKeySeq: expect.any(Number),
        },
      },
    ],
    stale: false,
    routeKeySeq: expect.any(Number),
  });
});

it('can push to a redirect', () => {
  mockRedirects.mockReturnValue([
    {
      source: '/foo',
      destination: '/bar',
    } as RedirectConfig,
  ]);

  renderRouter({
    index: () => null,
    bar: () => <Text testID="bar" />,
  });

  expectCompleteStateToMatch(store.state, {
    index: 0,
    key: expect.any(String),
    routeNames: ['__root', '+not-found', '_sitemap'],
    routes: [
      {
        key: expect.any(String),
        name: '__root',
        state: {
          index: 0,
          key: expect.any(String),
          routeNames: ['index', 'bar', 'foo'],
          routes: [
            {
              key: expect.any(String),
              name: 'index',
              path: '/',
            },
          ],
          stale: false,
          routeKeySeq: expect.any(Number),
        },
      },
    ],
    stale: false,
    routeKeySeq: expect.any(Number),
  });

  act(() => router.push('/foo'));

  expect(store.state).toStrictEqual({
    index: 0,
    key: expect.any(String),
    routeNames: ['__root', '+not-found', '_sitemap'],
    routes: [
      {
        key: expect.any(String),
        name: '__root',
        state: {
          index: 1,
          key: expect.any(String),
          routeNames: ['index', 'bar', 'foo'],
          routes: [
            {
              key: expect.any(String),
              name: 'index',
              path: '/',
            },
            {
              key: expect.any(String),
              name: 'bar',
              params: {},
              path: undefined,
            },
          ],
          stale: false,
          routeKeySeq: expect.any(Number),
          type: 'stack',
        },
      },
    ],
    stale: false,
    routeKeySeq: expect.any(Number),
    type: 'stack',
  });
});

it('does not render redirects in tabs', async () => {
  mockRedirects.mockReturnValue([
    {
      source: '/foo',
      destination: '/bar',
    } as RedirectConfig,
  ]);

  renderRouter({
    _layout: () => (
      <Tabs>
        <Tabs.Screen name="index" />
        <Tabs.Screen name="bar" />
      </Tabs>
    ),
    index: () => null,
    bar: () => <Text testID="bar" />,
  });

  expect(() => screen.getByLabelText('foo')).toThrow();
});

it('redirect to external URL', async () => {
  mockRedirects.mockReturnValue([
    {
      source: '/foo',
      destination: '//example.com',
    } as RedirectConfig,
  ]);

  renderRouter({
    _layout: () => (
      <Tabs>
        <Tabs.Screen name="index" />
        <Tabs.Screen name="bar" />
      </Tabs>
    ),
    index: () => null,
    bar: () => <Text testID="bar" />,
  });

  act(() => router.push('/foo'));

  expect(mockOpenURL).toHaveBeenCalledWith('https://example.com');
});

it('redirects will override existing routes', () => {
  mockRedirects.mockReturnValue([
    {
      source: '(tabs)/explore',
      destination: '//example.com',
    } as RedirectConfig,
  ]);

  renderRouter({
    _layout: () => <Stack />,
    '(tabs)/_layout': () => (
      <Tabs>
        <Tabs.Screen name="explore" />
      </Tabs>
    ),
    '(tabs)/explore': () => <Text testID="explore">Explore</Text>,
    index: () => null,
    bar: () => <Text testID="bar" />,
  });

  act(() => router.push('/explore'));

  expect(mockOpenURL).toHaveBeenCalledWith('https://example.com');
});

it('tabs can still work for redirects', () => {
  mockRedirects.mockReturnValue([
    {
      source: './(tabs)/explore',
      destination: '/page',
    } as RedirectConfig,
  ]);

  renderRouter(
    {
      _layout: () => <Stack />,
      '(tabs)/_layout': () => (
        <Tabs>
          <Tabs.Screen name="index" />
          <Tabs.Screen name="explore" />
        </Tabs>
      ),
      '(tabs)/index': () => <Text testID="index">Index</Text>,
      '(tabs)/explore': () => <Text testID="explore">Explore</Text>,
      '/page': () => <Text testID="page">Page</Text>,
    },
    {}
  );

  expect(mockOpenURL.mock.calls).toEqual([]);

  fireEvent.press(screen.getByLabelText('explore, tab, 2 of 2'));

  expect(screen).toHavePathname('/page');
  expect(mockOpenURL.mock.calls).toEqual([]);
});

it('tabs can still work for external redirects', () => {
  mockRedirects.mockReturnValue([
    {
      source: './(tabs)/explore.tsx',
      destination: '//example.com',
    } as RedirectConfig,
  ]);

  renderRouter(
    {
      _layout: () => <Stack />,
      '(tabs)/_layout': () => (
        <Tabs>
          <Tabs.Screen name="index" />
          <Tabs.Screen name="explore" />
        </Tabs>
      ),
      '(tabs)/index': () => <Text testID="index">Index</Text>,
      '(tabs)/explore': () => <Text testID="explore">Explore</Text>,
    },
    {}
  );

  expect(mockOpenURL.mock.calls).toEqual([]);

  fireEvent.press(screen.getByLabelText('explore, tab, 2 of 2'));

  expect(mockOpenURL.mock.calls).toEqual([['https://example.com']]);
});

it('not existing nested route redirects correctly', () => {
  mockRedirects.mockReturnValue([
    {
      source: '/test/1234',
      destination: '/explore',
    } as RedirectConfig,
  ]);

  renderRouter(
    {
      _layout: () => <Stack />,
      '[id]': () => <Text testID="id">ID</Text>,
      index: () => <Text testID="index">Index</Text>,
      explore: () => <Text testID="explore">Explore</Text>,
    },
    {}
  );

  act(() => router.push('/test/1234'));

  expect(store.state).toStrictEqual({
    index: 0,
    key: expect.any(String),
    routeNames: ['__root', '+not-found', '_sitemap'],
    routes: [
      {
        key: expect.any(String),
        name: '__root',
        state: {
          index: 1,
          key: expect.any(String),
          routeNames: ['index', 'explore', 'test/1234', '[id]'],
          routes: [
            {
              key: expect.any(String),
              name: 'index',
              path: '/',
            },
            {
              key: expect.any(String),
              name: 'explore',
              params: {},
              path: undefined,
            },
          ],
          stale: false,
          routeKeySeq: expect.any(Number),
          type: 'stack',
        },
      },
    ],
    stale: false,
    routeKeySeq: expect.any(Number),
    type: 'stack',
  });
});
