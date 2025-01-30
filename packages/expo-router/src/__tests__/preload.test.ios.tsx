import { ParamListBase, StackNavigationState } from '@react-navigation/native';
import React from 'react';

import { router } from '../imperative-api';
import { Stack } from '../layouts/Stack';
import { screen, renderRouter, act } from '../testing-library';
import { Preload } from '../Preload';

it('preload a sibling route', () => {
  renderRouter({
    index: function Index() {
      return null;
    },
    test: function Test() {
      return null;
    },
  });

  expect(screen).toHaveRouterState({
    routes: [
      {
        name: 'index',
        path: '/',
      },
    ],
    stale: true,
  });

  act(() => {
    router.preload('/test');
  });

  expect(screen).toHaveRouterState({
    index: 0,
    key: expect.any(String),
    preloadedRoutes: [
      {
        key: expect.any(String),
        name: 'test',
        params: {},
      },
    ],
    routeNames: ['index', 'test', '_sitemap', '+not-found'],
    routes: [
      {
        key: expect.any(String),
        name: 'index',
        params: undefined,
        path: '/',
      },
    ],
    stale: false,
    type: 'stack',
  } as StackNavigationState<ParamListBase>);
});

it('will preload the correct route within a group', () => {
  renderRouter({
    '(a)/index': () => null,
    '(a)/test': () => null,
    '(b)/index': () => null,
    '(b)/test': () => null,
  });

  expect(screen).toHaveRouterState({
    routes: [
      {
        name: '(a)/index',
        path: '/',
      },
    ],
    stale: true,
  });

  act(() => {
    router.preload('/test');
  });

  expect(screen).toHaveRouterState({
    index: 0,
    key: expect.any(String),
    preloadedRoutes: [
      {
        key: expect.any(String),
        name: '(a)/test',
        params: {},
      },
    ],
    routeNames: ['(a)/test', '(b)/test', '(a)/index', '(b)/index', '_sitemap', '+not-found'],
    routes: [
      {
        key: expect.any(String),
        name: '(a)/index',
        params: undefined,
        path: '/',
      },
    ],
    stale: false,
    type: 'stack',
  } as StackNavigationState<ParamListBase>);
});

it('will preload the correct route within nested groups', () => {
  renderRouter({
    '(a)/index': () => null,
    '(a)/(c)/test': () => null,
    '(b)/index': () => null,
    '(b)/test': () => null,
  });

  expect(screen).toHaveRouterState({
    routes: [
      {
        name: '(a)/index',
        path: '/',
      },
    ],
    stale: true,
  });

  act(() => {
    router.preload('/test');
  });

  expect(screen).toHaveRouterState({
    index: 0,
    key: expect.any(String),
    preloadedRoutes: [
      {
        key: expect.any(String),
        name: '(a)/(c)/test',
        params: {},
      },
    ],
    routeNames: ['(b)/test', '(a)/index', '(b)/index', '(a)/(c)/test', '_sitemap', '+not-found'],
    routes: [
      {
        key: expect.any(String),
        name: '(a)/index',
        params: undefined,
        path: '/',
      },
    ],
    stale: false,
    type: 'stack',
  } as StackNavigationState<ParamListBase>);
});

it('works with relative Href', () => {
  renderRouter({
    index: () => null,
    test: () => null,
  });

  expect(screen).toHaveRouterState({
    routes: [
      {
        name: 'index',
        path: '/',
      },
    ],
    stale: true,
  });

  act(() => {
    router.preload('./test');
  });

  expect(screen).toHaveRouterState({
    index: 0,
    key: expect.any(String),
    preloadedRoutes: [
      {
        key: expect.any(String),
        name: 'test',
        params: {},
      },
    ],
    routeNames: ['index', 'test', '_sitemap', '+not-found'],
    routes: [
      {
        key: expect.any(String),
        name: 'index',
        params: undefined,
        path: '/',
      },
    ],
    stale: false,
    type: 'stack',
  } as StackNavigationState<ParamListBase>);
});

it('works with params', () => {
  renderRouter({
    index: () => null,
    test: () => null,
  });

  expect(screen).toHaveRouterState({
    routes: [
      {
        name: 'index',
        path: '/',
      },
    ],
    stale: true,
  });

  act(() => {
    router.preload('./test?foo=bar');
  });

  expect(screen).toHaveRouterState({
    index: 0,
    key: expect.any(String),
    preloadedRoutes: [
      {
        key: expect.any(String),
        name: 'test',
        params: {
          foo: 'bar',
        },
      },
    ],
    routeNames: ['index', 'test', '_sitemap', '+not-found'],
    routes: [
      {
        key: expect.any(String),
        name: 'index',
        params: undefined,
        path: '/',
      },
    ],
    stale: false,
    type: 'stack',
  } as StackNavigationState<ParamListBase>);
});

it('ignores the current route', () => {
  renderRouter(
    {
      _layout: () => <Stack />,
      index: () => null,
      'directory/_layout': () => <Stack />,
      'directory/index': () => null,
    },
    {
      initialUrl: '/directory',
    }
  );

  expect(screen).toHaveRouterState({
    routes: [
      {
        name: 'directory',
        state: {
          routes: [{ name: 'index', path: '/directory' }],
          stale: true,
        },
      },
    ],
    stale: true,
  });

  act(() => {
    router.preload('/directory');
  });

  expect(screen).toHaveRouterState({
    index: 0,
    key: expect.any(String),
    preloadedRoutes: [],
    routeNames: ['index', '_sitemap', 'directory', '+not-found'],
    routes: [
      {
        key: expect.any(String),
        name: 'directory',
        params: undefined,
        state: {
          index: 0,
          key: expect.any(String),
          preloadedRoutes: [],
          routeNames: ['index'],
          routes: [
            {
              key: expect.any(String),
              name: 'index',
              params: {},
              path: '/directory',
            },
          ],
          stale: false,
          type: 'stack',
        } as StackNavigationState<ParamListBase>,
      },
    ],
    stale: false,
    type: 'stack',
  } as StackNavigationState<ParamListBase>);
});

it('can preload a deeply nested route', () => {
  const jestFn = jest.fn();

  renderRouter(
    {
      _layout: () => <Stack />,
      index: () => null,
      'directory/_layout': () => <Stack />,
      'directory/index': () => null,
      'directory/apple/_layout': () => {
        jestFn('apple');
        return <Stack />;
      },
      'directory/apple/banana/_layout': () => {
        jestFn('banana');
        return <Stack />;
      },
      'directory/apple/banana/index': () => {
        jestFn('index');
        return null;
      },
    },
    {
      initialUrl: '/directory',
    }
  );

  expect(screen).toHaveRouterState({
    routes: [
      {
        name: 'directory',
        state: {
          routes: [{ name: 'index', path: '/directory' }],
          stale: true,
        },
      },
    ],
    stale: true,
  });

  act(() => {
    router.preload('/directory/apple/banana');
  });

  expect(screen).toHavePathname('/directory');
  expect(jestFn.mock.calls).toEqual([['apple'], ['banana'], ['index']]);

  expect(screen).toHaveRouterState({
    index: 0,
    key: expect.any(String),
    preloadedRoutes: [],
    routeNames: ['index', '_sitemap', 'directory', '+not-found'],
    routes: [
      {
        key: expect.any(String),
        name: 'directory',
        params: undefined,
        state: {
          index: 0,
          key: expect.any(String),
          preloadedRoutes: [
            {
              key: expect.any(String),
              name: 'apple',
              params: {
                screen: 'banana',
                params: {
                  params: {},
                  screen: 'index',
                },
              },
            },
          ],
          routeNames: ['index', 'apple'],
          routes: [
            {
              key: expect.any(String),
              name: 'index',
              params: undefined,
              path: '/directory',
            },
          ],
          stale: false,
          type: 'stack',
        } as StackNavigationState<ParamListBase>,
      },
    ],
    stale: false,
    type: 'stack',
  } as StackNavigationState<ParamListBase>);
});

it('can preload a parent route', () => {
  renderRouter(
    {
      _layout: () => <Stack />,
      index: () => null,
      'directory/_layout': () => <Stack />,
      'directory/test': () => null,
      'directory/apple/_layout': () => {
        return <Stack />;
      },
      'directory/apple/banana/_layout': () => {
        return <Stack />;
      },
      'directory/apple/banana/index': () => {
        return null;
      },
    },
    {
      initialUrl: '/directory/apple/banana',
    }
  );

  expect(screen).toHaveRouterState({
    routes: [
      {
        name: 'directory',
        state: {
          routes: [
            {
              name: 'apple',
              state: {
                routes: [
                  {
                    name: 'banana',
                    state: {
                      routes: [
                        {
                          name: 'index',
                          path: '/directory/apple/banana',
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
          stale: true,
        },
      },
    ],
    stale: true,
  });

  act(() => {
    router.preload('/directory/test');
  });

  expect(screen).toHavePathname('/directory/apple/banana');

  expect(screen).toHaveRouterState({
    index: 0,
    key: expect.any(String),
    preloadedRoutes: [],
    routeNames: ['index', '_sitemap', 'directory', '+not-found'],
    routes: [
      {
        key: expect.any(String),
        name: 'directory',
        params: undefined,
        state: {
          index: 0,
          key: expect.any(String),
          preloadedRoutes: [
            {
              key: expect.any(String),
              name: 'test',
              params: {},
            },
          ],
          routeNames: ['test', 'apple'],
          routes: [
            {
              key: expect.any(String),
              name: 'apple',
              params: undefined,
              state: {
                routes: [
                  {
                    name: 'banana',
                    state: {
                      routes: [
                        {
                          name: 'index',
                          path: '/directory/apple/banana',
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
        } as StackNavigationState<ParamListBase>,
      },
    ],
    stale: false,
    type: 'stack',
  } as StackNavigationState<ParamListBase>);
});

it('will preload a route on focus', () => {
  renderRouter({
    index: () => {
      return <Preload href="/test" />;
    },
    test: () => null,
  });

  expect(screen).toHaveRouterState({
    index: 0,
    key: expect.any(String),
    preloadedRoutes: [
      {
        key: expect.any(String),
        name: 'test',
        params: {},
      },
    ],
    routeNames: ['index', 'test', '_sitemap', '+not-found'],
    routes: [
      {
        key: expect.any(String),
        name: 'index',
        params: undefined,
        path: '/',
      },
    ],
    stale: false,
    type: 'stack',
  } as StackNavigationState<ParamListBase>);
});
