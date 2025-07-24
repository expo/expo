import React from 'react';
import { Text } from 'react-native';

import { RedirectConfig, router } from '../exports';
import { store } from '../global-state/router-store';
import Stack from '../layouts/Stack';
import { Tabs } from '../layouts/Tabs';
import { screen, act, renderRouter, fireEvent } from '../testing-library';

const mockRedirects = jest.fn(() => [] as RedirectConfig[]);
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
        },
      },
    },
  };
});

jest.mock('expo-linking', () => {
  return {
    ...jest.requireActual('expo-linking'),
    get openURL() {
      return (url: string) => mockOpenURL(url);
    },
  };
});

it('deep link to a redirect', () => {
  mockRedirects.mockReturnValue([
    {
      source: '/foo',
      destination: '/bar',
    },
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

  expect(store.state).toStrictEqual({
    routes: [
      {
        name: '__root',
        state: {
          routes: [
            {
              name: 'bar',
              path: '/bar',
            },
          ],
          stale: true,
        },
      },
    ],
    stale: true,
  });
});

it('deep link to a dynamic redirect', () => {
  mockRedirects.mockReturnValue([
    {
      source: '/foo/[slug]',
      destination: 'deeply/nested/route/[slug]',
    },
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

  expect(store.state).toEqual({
    routes: [
      {
        name: '__root',
        params: {
          slug: 'bar',
        },
        state: {
          routes: [
            {
              name: 'deeply/nested/route/[slug]',
              params: {
                slug: 'bar',
              },
              path: '/deeply/nested/route/bar',
            },
          ],
          stale: true,
        },
      },
    ],
    stale: true,
  });
});

it('keeps extra params as query params', () => {
  mockRedirects.mockReturnValue([
    {
      source: '/foo/[slug]',
      destination: '/bar',
    },
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

  expect(store.state).toStrictEqual({
    routes: [
      {
        name: '__root',
        state: {
          routes: [
            {
              name: 'bar',
              path: '/bar',
            },
          ],
          stale: true,
        },
      },
    ],
    stale: true,
  });
});

it('can redirect from single to catch all', () => {
  mockRedirects.mockReturnValue([
    {
      source: '/foo/[slug]',
      destination: 'bar/[...slug]',
    },
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

  expect(store.state).toEqual({
    routes: [
      {
        name: '__root',
        params: {
          slug: ['bar'],
        },
        state: {
          routes: [
            {
              name: 'bar/[...slug]',
              params: {
                slug: ['bar'],
              },
              path: '/bar/bar',
            },
          ],
          stale: true,
        },
      },
    ],
    stale: true,
  });
});

it('can push to a redirect', () => {
  mockRedirects.mockReturnValue([
    {
      source: '/foo',
      destination: '/bar',
    },
  ]);

  renderRouter({
    index: () => null,
    bar: () => <Text testID="bar" />,
  });

  expect(store.state).toStrictEqual({
    routes: [
      {
        name: '__root',
        state: {
          routes: [
            {
              name: 'index',
              path: '/',
            },
          ],
          stale: true,
        },
      },
    ],
    stale: true,
  });

  act(() => router.push('/foo'));

  expect(store.state).toStrictEqual({
    index: 0,
    key: expect.any(String),
    preloadedRoutes: [],
    routeNames: ['__root'],
    routes: [
      {
        key: expect.any(String),
        name: '__root',
        params: undefined,
        state: {
          index: 1,
          key: expect.any(String),
          preloadedRoutes: [],
          routeNames: ['index', 'bar', 'foo', '_sitemap', '+not-found'],
          routes: [
            {
              key: expect.any(String),
              name: 'index',
              params: undefined,
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
          type: 'stack',
        },
      },
    ],
    stale: false,
    type: 'stack',
  });
});

it('does not render redirects in tabs', async () => {
  mockRedirects.mockReturnValue([
    {
      source: '/foo',
      destination: '/bar',
    },
  ]);

  renderRouter({
    _layout: () => <Tabs />,
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
    },
  ]);

  renderRouter({
    _layout: () => <Tabs />,
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
    },
  ]);

  renderRouter({
    _layout: () => <Stack />,
    '(tabs)/_layout': () => <Tabs />,
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
    },
  ]);

  renderRouter(
    {
      _layout: () => <Stack />,
      '(tabs)/_layout': () => <Tabs />,
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
    },
  ]);

  renderRouter(
    {
      _layout: () => <Stack />,
      '(tabs)/_layout': () => <Tabs />,
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
    },
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
    preloadedRoutes: [],
    routeNames: ['__root'],
    routes: [
      {
        key: expect.any(String),
        name: '__root',
        params: undefined,
        state: {
          index: 1,
          key: expect.any(String),
          preloadedRoutes: [],
          routeNames: ['index', 'explore', '_sitemap', 'test/1234', '[id]', '+not-found'],
          routes: [
            {
              key: expect.any(String),
              name: 'index',
              params: undefined,
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
          type: 'stack',
        },
      },
    ],
    stale: false,
    type: 'stack',
  });
});
