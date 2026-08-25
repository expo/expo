import { expectCompleteStateToMatch } from '../../__tests__/assertCompleteState';
import { ROOT_CHAIN } from '../../react-navigation/routers/stateKeys';
import {
  completeNavigationState,
  completeParsedState,
  createSeededRootState,
} from '../createSeededNavigationState';
import { node } from './__fixtures__/routeNode';

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

  expectCompleteStateToMatch(state, {
    stale: false,
    key: 'navigator:root',
    routeKeySeq: 1,
    index: 0,
    routeNames: ['__root', '+not-found', '_sitemap'],
    routes: [
      {
        key: '__root:0',
        name: '__root',
        state: {
          stale: false,
          key: 'navigator:0',
          routeKeySeq: 1,
          index: 0,
          routeNames: ['index', '(group)'],
          routes: [
            {
              key: '(group):0-0',
              name: '(group)',
              params: { section: 'fruit' },
              state: {
                stale: false,
                key: 'navigator:0-0',
                routeKeySeq: 2,
                index: 1,
                routeNames: ['anchor', '[id]'],
                routes: [
                  { key: 'anchor:0-0-0', name: 'anchor', params: { from: 'link' } },
                  {
                    key: '[id]:0-0-1',
                    name: '[id]',
                    params: { id: '42' },
                    state: {
                      stale: false,
                      key: 'navigator:0-0-1',
                      routeKeySeq: 1,
                      index: 0,
                      routeNames: ['details'],
                      routes: [
                        {
                          key: 'details:0-0-1-0',
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
  });
});

test('completes parsed routes without a route tree', () => {
  const state = completeParsedState(
    {
      routes: [
        {
          name: 'a',
          state: {
            routes: [{ name: 'b', path: '/foo/bar/apple', params: { id: 'apple' } }],
          },
        },
      ],
    },
    ROOT_CHAIN
  );

  expectCompleteStateToMatch(state, {
    stale: false,
    key: 'navigator:root',
    routeKeySeq: 1,
    index: 0,
    routeNames: ['a'],
    routes: [
      {
        key: 'a:0',
        name: 'a',
        state: {
          stale: false,
          key: 'navigator:0',
          routeKeySeq: 1,
          index: 0,
          routeNames: ['b'],
          routes: [
            {
              key: 'b:0-0',
              name: 'b',
              path: '/foo/bar/apple',
              params: { id: 'apple' },
            },
          ],
        },
      },
    ],
  });
});

test('creates the same state for the same parsed routes', () => {
  const routeNode = node('root', [node('a', [node('child')]), node('b', [node('child')])]);
  const parsedState = {
    routes: [
      {
        name: '__root',
        state: { routes: [{ name: 'a' }, { name: 'b' }] },
      },
    ],
  };

  expect(createSeededRootState(parsedState, routeNode)).toEqual(
    createSeededRootState(parsedState, routeNode)
  );
});

test('uses distinct chains for sibling and nested navigators', () => {
  const state = createSeededRootState(
    {
      routes: [
        {
          name: '__root',
          state: { routes: [{ name: 'a' }, { name: 'b' }] },
        },
      ],
    },
    node('root', [node('a', [node('child')]), node('b', [node('child')])])
  );
  const appState = state.routes[0]!.state!;
  const stateKeys = [state.key, appState.key, ...appState.routes.map((route) => route.state!.key)];

  expect(new Set(stateKeys).size).toBe(stateKeys.length);
});

test('falls back to the initial route when a nested state contains an unknown route', () => {
  const routeNode = node('root', [node('alpha'), node('beta')], 'beta');
  const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});

  const state = createSeededRootState(
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
  );

  expect(state.routes[0]!.state).toMatchObject({ index: 0, routes: [{ name: 'beta' }] });
  expect(warn).toHaveBeenCalledWith(expect.stringContaining('unknown route "unknown"'));
  warn.mockRestore();
});

test('falls back instead of preserving other parsed routes when one nested route is unknown', () => {
  const routeNode = node('root', [node('alpha'), node('beta')], 'alpha');
  const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});

  const state = createSeededRootState(
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
  );

  expect(state.routes[0]!.state).toMatchObject({ index: 0, routes: [{ name: 'alpha' }] });
  expect(warn).toHaveBeenCalledWith(expect.stringContaining('unknown route "unknown"'));
  warn.mockRestore();
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

test('falls back when the root state contains an unknown route', () => {
  const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});

  const state = createSeededRootState(
    { routes: [{ name: 'unknown' }] },
    node('root', [node('index')])
  );

  expect(state.routes[0]).toMatchObject({ name: '__root', state: { routes: [{ name: 'index' }] } });
  expect(warn).toHaveBeenCalledWith(expect.stringContaining('unknown route "unknown"'));
  warn.mockRestore();
});

test('returns an already complete navigation state unchanged', () => {
  const routeNode = node('root', [node('index')]);
  const state = createSeededRootState(undefined, routeNode);

  expect(completeNavigationState(state, routeNode)).toBe(state);
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
