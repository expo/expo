import { expectCompleteStateToMatch } from '../../__tests__/assertCompleteState';
import { ROOT_CHAIN } from '../../react-navigation/routers/stateKeys';
import {
  applyPendingAnchor,
  completeNavigationState,
  completeParsedState,
  createSeededNavigationState,
  createSeededRootState,
} from '../createSeededNavigationState';
import { node } from './__fixtures__/routeNode';

test('completes nested parsed routes and marks each navigator with a pending anchor', () => {
  const routeNode = node('root', [
    node('index'),
    node('(group)', [node('[id]', [node('details')]), node('anchor')]),
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
          __internal__pendingAnchor: { type: 'prepend' },
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
                routeNames: ['[id]', 'anchor'],
                __internal__pendingAnchor: { type: 'prepend', params: { id: '42' } },
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
                      __internal__pendingAnchor: { type: 'prepend' },
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

test('falls back to the first route when a nested state contains an unknown route', () => {
  const routeNode = node('root', [node('alpha'), node('beta')]);
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

  expect(state.routes[0]!.state).toMatchObject({
    index: 0,
    routes: [{ name: 'beta' }],
    __internal__pendingAnchor: { type: 'initial' },
  });
  expect(warn).toHaveBeenCalledWith(expect.stringContaining('unknown route "unknown"'));
  warn.mockRestore();
});

test('falls back instead of preserving other parsed routes when one nested route is unknown', () => {
  const routeNode = node('root', [node('alpha'), node('beta')]);
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

  expect(state.routes[0]!.state).toMatchObject({ index: 0, routes: [{ name: 'beta' }] });
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

describe(applyPendingAnchor, () => {
  const routeNode = node('root', [node('anchor', [node('index')]), node('[id]')]);

  it('puts the anchor with the path params below the target without changing the target key', () => {
    const seeded = createSeededNavigationState(
      { routes: [{ name: '[id]', params: { id: '1', query: 'x' } }] },
      routeNode,
      '0'
    );

    expect(applyPendingAnchor(seeded, routeNode, 'anchor')).toStrictEqual({
      stale: false,
      key: 'navigator:0',
      routeKeySeq: 2,
      index: 1,
      routeNames: ['[id]', 'anchor'],
      routes: [
        {
          key: 'anchor:0-1',
          name: 'anchor',
          params: { id: '1' },
          state: {
            stale: false,
            key: 'navigator:0-1',
            routeKeySeq: 1,
            index: 0,
            routeNames: ['index'],
            routes: [{ key: 'index:0-1-0', name: 'index' }],
            __internal__pendingAnchor: { type: 'initial' },
          },
        },
        { key: '[id]:0-0', name: '[id]', params: { id: '1', query: 'x' } },
      ],
    });
  });

  it('replaces routes picked without the anchor', () => {
    const seeded = createSeededNavigationState(undefined, routeNode, '0');

    expect(applyPendingAnchor(seeded, routeNode, 'anchor')).toMatchObject({
      routeKeySeq: 2,
      index: 0,
      routes: [{ key: 'anchor:0-1', name: 'anchor', state: { key: 'navigator:0-1' } }],
    });
    expect(applyPendingAnchor(seeded, routeNode, 'anchor')).not.toHaveProperty(
      '__internal__pendingAnchor'
    );
  });

  it('only removes the marker when the anchor is already a route', () => {
    const seeded = createSeededNavigationState({ routes: [{ name: '[id]' }] }, routeNode, '0');
    // The marker is internal, so `NavigationState` does not declare it.
    const { __internal__pendingAnchor, ...unmarked } = seeded as typeof seeded & {
      __internal__pendingAnchor: unknown;
    };

    expect(applyPendingAnchor(seeded, routeNode, '[id]')).toStrictEqual(unmarked);
    expect(applyPendingAnchor(seeded, routeNode, undefined)).toStrictEqual(unmarked);
  });
});
