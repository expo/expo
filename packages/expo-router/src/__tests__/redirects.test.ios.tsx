import React from 'react';
import { Text } from 'react-native';

import { RedirectConfig, router } from '../exports';
import { store } from '../global-state/router-store';
import { Tabs } from '../layouts/Tabs';
import { screen, act, renderRouter } from '../testing-library';

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

  expect(store.rootStateSnapshot()).toStrictEqual({
    routes: [
      {
        name: 'bar',
        path: 'bar',
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

  expect(store.rootStateSnapshot()).toEqual({
    routes: [
      {
        name: 'deeply/nested/route/[slug]',
        params: {
          slug: 'bar',
        },
        path: 'deeply/nested/route/bar',
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

  expect(store.rootStateSnapshot()).toStrictEqual({
    routes: [
      {
        name: 'bar',
        path: 'bar',
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

  expect(store.rootStateSnapshot()).toEqual({
    routes: [
      {
        name: 'bar/[...slug]',
        params: {
          slug: ['bar'],
        },
        path: 'bar/bar',
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
    routeNames: ['index', 'bar', '_sitemap', '+not-found'],
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
