import { Text } from 'react-native';

import Stack from '../../layouts/Stack';
import Tabs from '../../layouts/Tabs';
import { renderRouter } from '../../testing-library';
import { useRootNavigationState } from '../useRootNavigationState';
import { renderHook } from './renderHook';

describe(useRootNavigationState, () => {
  it('returns the root navigation state', () => {
    const { result } = renderHook(() => useRootNavigationState(), ['index'], {
      initialUrl: '/?test=1&test=2',
    });

    expect(result.current).toEqual({
      index: 0,
      key: expect.any(String),
      routeNames: ['__root', '+not-found', '_sitemap'],
      routes: [
        {
          key: expect.any(String),
          name: '__root',
          params: undefined,
          state: {
            routes: [
              {
                name: 'index',
                params: {
                  test: ['1', '2'],
                },
                path: '/?test=1&test=2',
              },
            ],
            stale: true,
          },
        },
      ],
      stale: false,
      type: 'stack',
    });
  });

  it('can be used within a nested route', () => {
    const fn = jest.fn();

    renderRouter({
      _layout: () => <Stack />,
      '(app)/_layout': () => <Tabs />,
      '(app)/index': function Index() {
        fn(useRootNavigationState());
        return <Text>Index</Text>;
      },
    });

    expect(fn).toHaveBeenCalledWith({
      index: 0,
      key: expect.any(String),
      routeNames: ['__root', '+not-found', '_sitemap'],
      routes: [
        {
          key: expect.any(String),
          name: '__root',
          params: undefined,
          state: {
            routes: [
              {
                name: '(app)',
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
          },
        },
      ],
      stale: false,
      type: 'stack',
    });
  });

  it('can be used within a layout', () => {
    const fn = jest.fn();

    renderRouter({
      _layout: function Layout() {
        fn(useRootNavigationState());
        return <Stack />;
      },
      index: () => <Text>Index</Text>,
    });

    expect(fn).toHaveBeenCalledWith({
      index: 0,
      key: expect.any(String),
      routeNames: ['__root', '+not-found', '_sitemap'],
      routes: [
        {
          key: expect.any(String),
          name: '__root',
          params: undefined,
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
      stale: false,
      type: 'stack',
    });
  });

  it('can be used within a nested layout', () => {
    const fn = jest.fn();

    renderRouter({
      _layout: () => <Stack />,
      '(app)/_layout': function Layout() {
        fn(useRootNavigationState());
        return <Tabs />;
      },
      '(app)/index': () => <Text>Index</Text>,
    });

    expect(fn).toHaveBeenCalledWith({
      index: 0,
      key: expect.any(String),
      routeNames: ['__root', '+not-found', '_sitemap'],
      routes: [
        {
          key: expect.any(String),
          name: '__root',
          params: undefined,
          state: {
            routes: [
              {
                name: '(app)',
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
          },
        },
      ],
      stale: false,
      type: 'stack',
    });
  });
});
