import React from 'react';
import { Text } from 'react-native';

import { RedirectConfig, router } from '../exports';
import { store } from '../global-state/router-store';
import { Tabs } from '../layouts/Tabs';
import { screen, act, renderRouter } from '../testing-library';

const mockRedirects = jest.fn(() => [] as RedirectConfig[]);

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

it('deep link to a redirect', () => {
  mockRedirects.mockReturnValueOnce([
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

  expect(store.rootStateSnapshot()).toStrictEqual({
    index: 0,
    key: expect.any(String),
    preloadedRoutes: [],
    routeNames: ['index', 'bar', 'foo', '_sitemap', '+not-found'],
    routes: [
      {
        key: expect.any(String),
        name: 'bar',
        params: {},
      },
    ],
    stale: false,
    type: 'stack',
  });
});

it('deep link to a dynamic redirect', () => {
  mockRedirects.mockReturnValueOnce([
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

  expect(store.rootStateSnapshot()).toStrictEqual({
    index: 0,
    key: expect.any(String),
    preloadedRoutes: [],
    routeNames: ['index', '_sitemap', 'deeply/nested/route/[slug]', 'foo/[slug]', '+not-found'],
    routes: [
      {
        key: expect.any(String),
        name: 'deeply/nested/route/[slug]',
        params: {
          slug: 'bar',
        },
      },
    ],
    stale: false,
    type: 'stack',
  });
});

it('keeps extra params as query params', () => {
  mockRedirects.mockReturnValueOnce([
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

  expect(store.rootStateSnapshot()).toStrictEqual({
    index: 0,
    key: expect.any(String),
    preloadedRoutes: [],
    routeNames: ['index', 'bar', '_sitemap', 'foo/[slug]', '+not-found'],
    routes: [
      {
        key: expect.any(String),
        name: 'bar',
        params: {
          extra: 'param',
          slug: 'hello',
        },
      },
    ],
    stale: false,
    type: 'stack',
  });
});

it('can redirect from single to catch all', () => {
  mockRedirects.mockReturnValueOnce([
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

  expect(store.rootStateSnapshot()).toStrictEqual({
    index: 0,
    key: expect.any(String),
    preloadedRoutes: [],
    routeNames: ['index', '_sitemap', 'foo/[slug]', 'bar/[...slug]', '+not-found'],
    routes: [
      {
        key: expect.any(String),
        name: 'bar/[...slug]',
        params: {
          slug: ['bar'],
        },
      },
    ],
    stale: false,
    type: 'stack',
  });
});

it('can push to a redirect', () => {
  mockRedirects.mockReturnValueOnce([
    {
      source: '/foo',
      destination: '/bar',
    },
  ]);

  renderRouter({
    index: () => null,
    bar: () => <Text testID="bar" />,
  });

  expect(store.rootStateSnapshot()).toStrictEqual({
    routes: [
      {
        name: 'index',
        path: '/',
      },
    ],
    stale: true,
  });

  act(() => router.push('/foo'));

  expect(store.rootStateSnapshot()).toStrictEqual({
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
      },
    ],
    stale: false,
    type: 'stack',
  });
});

it('does not render redirects in tabs', async () => {
  mockRedirects.mockReturnValueOnce([
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
