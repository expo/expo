import { act, renderHook as renderNativeHook } from '@testing-library/react-native';
import { Text } from 'react-native';

import { router } from '../../imperative-api';
import Stack from '../../layouts/Stack';
import Tabs from '../../layouts/Tabs';
import { renderRouter } from '../../testing-library';
import { useRootNavigationState } from '../useRootNavigationState';
import { renderHook } from './renderHook';

describe(useRootNavigationState, () => {
  it('throws outside a navigation container', async () => {
    await expect(async () => renderNativeHook(() => useRootNavigationState())).rejects.toThrow(
      'useRootNavigationState was called from a generated route. This is likely a bug in Expo Router.'
    );
  });

  it('returns the updated root state after navigation', async () => {
    const states: ReturnType<typeof useRootNavigationState>[] = [];

    await renderRouter({
      _layout: () => <Stack />,
      index: function Index() {
        states.push(useRootNavigationState());
        return <Text>Index</Text>;
      },
      second: () => <Text>Second</Text>,
    });

    const initialState = states[states.length - 1];

    await act(() => router.push('/second'));

    expect(states[states.length - 1]).not.toBe(initialState);
    expect(states[states.length - 1]?.routes[0]?.state?.routes.at(-1)?.name).toBe('second');
  });

  it('returns the root navigation state', async () => {
    const { result } = await renderHook(() => useRootNavigationState(), ['index'], {
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
          state: {
            index: 0,
            key: expect.any(String),
            routeNames: ['index'],
            routes: [
              {
                key: expect.any(String),
                name: 'index',
                params: {
                  test: ['1', '2'],
                },
                path: '/?test=1&test=2',
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

  it('can be used within a nested route', async () => {
    const fn = jest.fn();

    await renderRouter({
      _layout: () => <Stack />,
      '(app)/_layout': () => (
        <Tabs>
          <Tabs.Screen name="index" />
        </Tabs>
      ),
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
          state: {
            index: 0,
            key: expect.any(String),
            routeNames: ['(app)'],
            routes: [
              {
                key: expect.any(String),
                name: '(app)',
                state: {
                  index: 0,
                  key: expect.any(String),
                  routeNames: ['index'],
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
          },
        },
      ],
      stale: false,
      routeKeySeq: expect.any(Number),
    });
  });

  it('can be used within a layout', async () => {
    const fn = jest.fn();

    await renderRouter({
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
          state: {
            index: 0,
            key: expect.any(String),
            routeNames: ['index'],
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
  });

  it('can be used within a nested layout', async () => {
    const fn = jest.fn();

    await renderRouter({
      _layout: () => <Stack />,
      '(app)/_layout': function Layout() {
        fn(useRootNavigationState());
        return (
          <Tabs>
            <Tabs.Screen name="index" />
          </Tabs>
        );
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
          state: {
            index: 0,
            key: expect.any(String),
            routeNames: ['(app)'],
            routes: [
              {
                key: expect.any(String),
                name: '(app)',
                state: {
                  index: 0,
                  key: expect.any(String),
                  routeNames: ['index'],
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
          },
        },
      ],
      stale: false,
      routeKeySeq: expect.any(Number),
    });
  });
});
