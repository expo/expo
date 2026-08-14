import type { RouteNode } from '../../Route';
import { completeParsedState, createSeededRootState } from '../createSeededNavigationState';

jest.mock('nanoid/non-secure', () => {
  let id = 0;
  return { nanoid: () => `test-${++id}` };
});

function node(route: string, children: RouteNode[] = [], initialRouteName?: string): RouteNode {
  return {
    type: 'route',
    route,
    children,
    initialRouteName,
    dynamic: null,
    contextKey: route,
    loadRoute: () => ({}),
  };
}

function expectCompleteState(state: object) {
  expect(state).toMatchObject({
    stale: false,
    key: expect.any(String),
    index: expect.any(Number),
    routeNames: expect.any(Array),
    routes: expect.any(Array),
  });

  for (const route of (state as { routes: { key?: string; state?: object }[] }).routes) {
    expect(route.key).toEqual(expect.any(String));
    if (route.state) {
      expectCompleteState(route.state);
    }
  }
}

test('completes nested parsed routes without dropping anchor or dynamic params', () => {
  const routeNode = node('root', [
    node('index'),
    node('(group)', [node('[id]', [node('details')]), node('anchor')], 'anchor'),
  ]);

  const state = createSeededRootState(
    {
      routes: [
        {
          name: '__root',
          state: {
            routes: [
              {
                name: '(group)',
                params: { section: 'fruit' },
                state: {
                  index: 1,
                  routes: [
                    { name: 'anchor', params: { from: 'link' } },
                    {
                      name: '[id]',
                      params: { id: '42' },
                      state: {
                        routes: [
                          {
                            name: 'details',
                            params: { tab: 'info' },
                            path: '/fruit/42',
                          },
                        ],
                      },
                    },
                  ],
                },
              },
            ],
          },
        },
      ],
    },
    routeNode
  );

  expectCompleteState(state);
  expect(state.routes[0]!.state).toMatchObject({
    routeNames: ['index', '(group)'],
    routes: [
      {
        name: '(group)',
        params: { section: 'fruit' },
        state: {
          index: 1,
          routeNames: ['anchor', '[id]'],
          routes: [
            { name: 'anchor', params: { from: 'link' } },
            {
              name: '[id]',
              params: { id: '42' },
              state: {
                routeNames: ['details'],
                routes: [{ name: 'details', params: { tab: 'info' }, path: '/fruit/42' }],
              },
            },
          ],
        },
      },
    ],
  });
  expect(JSON.stringify(state)).not.toContain('__internal__routerActionState');
  expect(JSON.stringify(state)).not.toContain('"type"');
});

test('completes parsed routes without a route tree', () => {
  const state = completeParsedState({
    routes: [
      {
        name: 'a',
        state: {
          routes: [{ name: 'b', path: '/foo/bar/apple', params: { id: 'apple' } }],
        },
      },
    ],
  });

  expectCompleteState(state!);
  expect(state?.routes[0]!.state?.routes[0]).toMatchObject({
    name: 'b',
    path: '/foo/bar/apple',
    params: { id: 'apple' },
  });
});

test('throws when a nested state contains an unknown route', () => {
  const routeNode = node('root', [node('alpha'), node('beta')], 'beta');

  expect(() =>
    createSeededRootState(
      {
        routes: [
          {
            name: '__root',
            state: {
              index: -10,
              routes: [{ name: 'unknown', state: { routes: [{ name: 'leaked' }] } }],
            },
          },
        ],
      },
      routeNode
    )
  ).toThrow('The initial navigation state contains the unknown route "unknown".');
});

test('throws when one of multiple nested routes is unknown', () => {
  const routeNode = node('root', [node('alpha'), node('beta')]);

  expect(() =>
    createSeededRootState(
      {
        routes: [
          {
            name: '__root',
            state: {
              index: 1,
              routes: [{ name: 'unknown' }, { name: 'alpha' }, { name: 'beta' }],
            },
          },
        ],
      },
      routeNode
    )
  ).toThrow('The initial navigation state contains the unknown route "unknown".');
});

test('preserves the focused occurrence of a duplicate route', () => {
  const state = createSeededRootState(
    {
      routes: [
        {
          name: '__root',
          state: {
            index: 1,
            routes: [{ name: 'alpha' }, { name: 'alpha' }],
          },
        },
      ],
    },
    node('root', [node('alpha')])
  );

  expect(state.routes[0]!.state).toMatchObject({
    index: 1,
    routes: [{ name: 'alpha' }, { name: 'alpha' }],
  });
});

test('resolves an initial route to its directory index route', () => {
  const state = createSeededRootState(
    {
      routes: [
        {
          name: '__root',
          state: {
            routes: [{ name: 'home' }, { name: 'settings' }],
          },
        },
      ],
    },
    node('root', [node('home/index'), node('settings')], 'home')
  );

  expect(state.routes[0]!.state).toMatchObject({
    index: 1,
    routeNames: ['home/index', 'settings'],
    routes: [{ name: 'home/index' }, { name: 'settings' }],
  });
});

test('does not duplicate a directory index route used as the initial route', () => {
  const state = createSeededRootState(
    {
      routes: [
        {
          name: '__root',
          state: {
            index: 1,
            routes: [{ name: 'home' }, { name: 'home/index', path: '/home' }],
          },
        },
      ],
    },
    node('root', [node('home/index'), node('settings')], 'home')
  );

  expect(state.routes[0]!.state).toMatchObject({
    index: 0,
    routeNames: ['home/index', 'settings'],
    routes: [{ name: 'home/index', path: '/home' }],
  });
});

test('returns the default root state for an empty parse', () => {
  const routeNode = node('root', [node('index')]);

  expect(createSeededRootState(undefined, routeNode)).toMatchObject({
    index: 0,
    routeNames: ['__root', '+not-found', '_sitemap'],
    routes: [{ name: '__root', key: expect.any(String) }],
  });
});

test('throws when the root state contains an unknown route', () => {
  expect(() =>
    createSeededRootState({ routes: [{ name: 'unknown' }] }, node('root', [node('index')]))
  ).toThrow('The initial navigation state contains the unknown route "unknown".');
});

test.each(['+not-found', '_sitemap'])('keeps the root %s route as a leaf', (name) => {
  const state = createSeededRootState(
    {
      routes: [
        {
          name,
          path: '/special',
          params: { requested: '/missing' },
          state: { routes: [{ name: 'invalid-child' }] },
        },
      ],
    },
    node('root', [node('index')])
  );

  expect(state.routes).toEqual([
    {
      key: expect.any(String),
      name,
      path: '/special',
      params: { requested: '/missing' },
    },
  ]);
});
