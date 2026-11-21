import { screen, act } from '@testing-library/react-native';

import { router } from '../imperative-api';
import Stack from '../layouts/StackClient';
import { renderRouter } from '../testing-library';

it('should go back to a previous route in the same stack', async () => {
  await renderRouter({
    index: () => null,
    '1/_layout': () => <Stack />,
    '1/a': () => null,
    '1/b': () => null,
    '1/c': () => null,
  });

  await act(() => router.push('/1/a'));
  await act(() => router.push('/1/b'));
  await act(() => router.push('/1/c'));

  expect(screen).toHavePathname('/1/c');
  expect(screen).toHaveRouterState({
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
          routeNames: ['index', '1'],
          routes: [
            {
              key: expect.any(String),
              name: 'index',
              path: '/',
            },
            {
              key: expect.any(String),
              name: '1',
              params: {},
              path: undefined,
              state: {
                index: 2,
                key: expect.any(String),
                routeNames: ['a', 'b', 'c'],
                routes: [
                  {
                    key: expect.any(String),
                    name: 'a',
                    params: {},
                    path: '/1/a',
                  },
                  {
                    key: expect.any(String),
                    name: 'b',
                    params: {},
                    path: undefined,
                  },
                  {
                    key: expect.any(String),
                    name: 'c',
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
        },
      },
    ],
    stale: false,
    routeKeySeq: expect.any(Number),
    type: 'stack',
  });

  await act(() => router.dismissTo('/1/a'));
  expect(screen).toHavePathname('/1/a');
  expect(screen).toHaveRouterState({
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
          routeNames: ['index', '1'],
          routes: [
            {
              key: expect.any(String),
              name: 'index',
              path: '/',
            },
            {
              key: expect.any(String),
              name: '1',
              params: {},
              path: undefined,
              state: {
                index: 0,
                key: expect.any(String),
                routeNames: ['a', 'b', 'c'],
                routes: [
                  {
                    key: expect.any(String),
                    name: 'a',
                    params: {},
                    path: '/1/a',
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
        },
      },
    ],
    stale: false,
    routeKeySeq: expect.any(Number),
    type: 'stack',
  });
});

it('should go back to a previous route in different stacks', async () => {
  await renderRouter({
    index: () => null,
    '1/_layout': () => <Stack />,
    '1/a': () => null,
    '1/b': () => null,
    '1/2/_layout': () => <Stack />,
    '1/2/c': () => null,
    '1/2/d': () => null,
    '1/2/3/_layout': () => <Stack />,
    '1/2/3/e': () => null,
    '1/2/3/d': () => null,
  });

  await act(() => router.push('/1/a'));
  await act(() => router.push('/1/2/c'));
  await act(() => router.push('/1/2/3/e'));

  expect(screen).toHavePathname('/1/2/3/e');
  expect(screen).toHaveRouterState({
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
          routeNames: ['index', '1'],
          routes: [
            {
              key: expect.any(String),
              name: 'index',
              path: '/',
            },
            {
              key: expect.any(String),
              name: '1',
              params: {},
              path: undefined,
              state: {
                index: 1,
                key: expect.any(String),
                routeNames: ['a', 'b', '2'],
                routes: [
                  {
                    key: expect.any(String),
                    name: 'a',
                    params: {},
                    path: '/1/a',
                  },
                  {
                    key: expect.any(String),
                    name: '2',
                    params: {},
                    path: undefined,
                    state: {
                      index: 1,
                      key: expect.any(String),
                      routeNames: ['c', 'd', '3'],
                      routes: [
                        {
                          key: expect.any(String),
                          name: 'c',
                          params: {},
                          path: '/1/2/c',
                        },
                        {
                          key: expect.any(String),
                          name: '3',
                          params: {},
                          path: undefined,
                          state: {
                            index: 0,
                            key: expect.any(String),
                            routeNames: ['e', 'd'],
                            routes: [
                              {
                                key: expect.any(String),
                                name: 'e',
                                params: {},
                                path: '/1/2/3/e',
                              },
                            ],
                            stale: false,
                            routeKeySeq: expect.any(Number),
                          },
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
              },
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

  await act(() => router.dismissTo('/1/a'));
  expect(screen).toHavePathname('/1/a');
  expect(screen).toHaveRouterState({
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
          routeNames: ['index', '1'],
          routes: [
            {
              key: expect.any(String),
              name: 'index',
              path: '/',
            },
            {
              key: expect.any(String),
              name: '1',
              params: {},
              path: undefined,
              state: {
                index: 0,
                key: expect.any(String),
                routeNames: ['a', 'b', '2'],
                routes: [
                  {
                    key: expect.any(String),
                    name: 'a',
                    params: {},
                    path: '/1/a',
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
        },
      },
    ],
    stale: false,
    routeKeySeq: expect.any(Number),
    type: 'stack',
  });
});

it('will replace the route if the provided href is not in the history', async () => {
  await renderRouter({
    index: () => null,
    '1/_layout': () => <Stack />,
    '1/a': () => null,
    '1/b': () => null,
    '1/2/_layout': () => <Stack />,
    '1/2/c': () => null,
    '1/2/d': () => null,
    '1/2/3/_layout': () => <Stack />,
    '1/2/3/e': () => null,
    '1/2/3/d': () => null,
  });

  await act(() => router.push('/1/a'));
  await act(() => router.push('/1/2/c'));

  await act(() => router.dismissTo('/1/2/3/e'));

  expect(screen).toHavePathname('/1/2/3/e');
  expect(screen).toHaveRouterState({
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
          routeNames: ['index', '1'],
          routes: [
            {
              key: expect.any(String),
              name: 'index',
              path: '/',
            },
            {
              key: expect.any(String),
              name: '1',
              params: {},
              path: undefined,
              state: {
                index: 1,
                key: expect.any(String),
                routeNames: ['a', 'b', '2'],
                routes: [
                  {
                    key: expect.any(String),
                    name: 'a',
                    params: {},
                    path: '/1/a',
                  },
                  {
                    key: expect.any(String),
                    name: '2',
                    params: {},
                    path: undefined,
                    state: {
                      index: 0,
                      key: expect.any(String),
                      routeNames: ['c', 'd', '3'],
                      routes: [
                        {
                          key: expect.any(String),
                          name: '3',
                          params: {},
                          state: {
                            index: 0,
                            key: expect.any(String),
                            routeNames: ['e', 'd'],
                            routes: [
                              {
                                key: expect.any(String),
                                name: 'e',
                                params: {},
                                path: '/1/2/3/e',
                              },
                            ],
                            stale: false,
                            routeKeySeq: expect.any(Number),
                          },
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
              },
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

it('collapses a nested history down to a sibling when the target was never visited', async () => {
  await renderRouter({
    index: () => null,
    'b/_layout': () => <Stack />,
    'b/c': () => null,
    d: () => null,
  });

  await act(() => router.push('/b/c'));
  expect(screen).toHavePathname('/b/c');

  await act(() => router.dismissTo('/d'));

  expect(screen).toHavePathname('/d');
  expect(screen).toHaveRouterState({
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
          routeNames: ['index', 'd', 'b'],
          routes: [
            { key: expect.any(String), name: 'index', path: '/' },
            { key: expect.any(String), name: 'd', params: {} },
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

it('should go back to a previous route in a nested stack when a screen above that stack is focused', async () => {
  const result = await renderRouter({
    _layout: () => <Stack />,
    '(group)/_layout': () => <Stack />,
    '(group)/index': () => null,
    '(group)/details': () => null,
    modal: () => null,
  });

  await act(() => router.push('/details'));
  await act(() => router.push('/modal'));
  expect(screen).toHavePathname('/modal');

  await act(() => router.dismissTo('/'));

  expect(screen).toHavePathname('/');
  const rootStack = result.getRouterState()!.routes[0]!.state!;
  expect(rootStack.routes.map((route) => route.name)).toEqual(['(group)']);
  const groupStack = rootStack.routes[0]!.state!;
  expect(groupStack.routes.map((route) => route.name)).toEqual(['index']);
  expect(groupStack.index).toBe(0);
});

it('pushes a dynamic route with different params in a nested stack when a screen above that stack is focused', async () => {
  const result = await renderRouter({
    _layout: () => <Stack />,
    '(group)/_layout': () => <Stack />,
    '(group)/index': () => null,
    '(group)/[id]': () => null,
    modal: () => null,
  });

  await act(() => router.push('/1'));
  await act(() => router.push('/modal'));
  expect(screen).toHavePathname('/modal');

  await act(() => router.dismissTo('/2'));

  expect(screen).toHavePathname('/2');
  const rootStack = result.getRouterState()!.routes[0]!.state!;
  expect(rootStack.routes.map((route) => route.name)).toEqual(['(group)']);
  const groupStack = rootStack.routes[0]!.state!;
  expect(groupStack.routes.map((route) => route.name)).toEqual(['index', '[id]', '[id]']);
  expect(groupStack.routes[1]!.params).toEqual({ id: '1' });
  expect(groupStack.routes[2]!.params).toEqual({ id: '2' });
  expect(groupStack.index).toBe(2);
});

it('replaces the current screen when the dynamic layout in the history has different params', async () => {
  const result = await renderRouter({
    _layout: () => <Stack />,
    index: () => null,
    '[slug]/(group)/_layout': () => <Stack />,
    '[slug]/(group)/index': () => null,
    '[slug]/details': () => null,
  });

  await act(() => router.push('/a'));
  await act(() => router.push('/a/details'));
  expect(screen).toHavePathname('/a/details');

  await act(() => router.dismissTo('/b'));

  expect(screen).toHavePathname('/b');
  const rootStack = result.getRouterState()!.routes[0]!.state!;
  expect(rootStack.routes.map((route) => route.name)).toEqual([
    'index',
    '[slug]/(group)',
    '[slug]/(group)',
  ]);
  expect(rootStack.routes[1]!.params).toEqual({ slug: 'a' });
  expect(rootStack.routes[2]!.params).toEqual({ slug: 'b' });
  expect(rootStack.index).toBe(2);
});

it('replaces the current screen when the dynamic route in the history has different params', async () => {
  const result = await renderRouter({
    _layout: () => <Stack />,
    index: () => null,
    '[id]': () => null,
    modal: () => null,
  });

  await act(() => router.push('/1'));
  await act(() => router.push('/modal'));
  expect(screen).toHavePathname('/modal');

  await act(() => router.dismissTo('/2'));

  expect(screen).toHavePathname('/2');
  const rootStack = result.getRouterState()!.routes[0]!.state!;
  expect(rootStack.routes.map((route) => route.name)).toEqual(['index', '[id]', '[id]']);
  expect(rootStack.routes[1]!.params).toEqual({ id: '1' });
  expect(rootStack.routes[2]!.params).toEqual({ id: '2' });
  expect(rootStack.index).toBe(2);
});

it('goes back to the dynamic route with the same params when it is lower in the stack', async () => {
  const result = await renderRouter({
    _layout: () => <Stack />,
    index: () => null,
    '[id]': () => null,
    modal: () => null,
  });

  await act(() => router.push('/1'));
  await act(() => router.push('/2'));
  await act(() => router.push('/modal'));
  expect(screen).toHavePathname('/modal');

  await act(() => router.dismissTo('/1'));

  expect(screen).toHavePathname('/1');
  const rootStack = result.getRouterState()!.routes[0]!.state!;
  expect(rootStack.routes.map((route) => route.name)).toEqual(['index', '[id]']);
  expect(rootStack.routes[1]!.params).toEqual({ id: '1' });
  expect(rootStack.index).toBe(1);
});

it('does not reuse a preloaded dynamic route with different params', async () => {
  const result = await renderRouter({
    _layout: () => <Stack />,
    index: () => null,
    '[id]': () => null,
    modal: () => null,
  });

  await act(() => router.push('/1'));
  await act(() => router.push('/modal'));
  await act(() => router.prefetch('/3'));
  expect(screen).toHavePathname('/modal');

  await act(() => router.dismissTo('/2'));

  expect(screen).toHavePathname('/2');
  const rootStack = result.getRouterState()!.routes[0]!.state!;
  expect(rootStack.index).toBe(2);
  expect(rootStack.routes.map((route) => route.params)).toEqual([
    undefined,
    { id: '1' },
    { id: '2' },
    { id: '3' },
  ]);
});
