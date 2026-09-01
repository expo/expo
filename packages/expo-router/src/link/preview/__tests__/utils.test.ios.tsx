import { getLinkingConfig } from '../../../getLinkingConfig';
import { getRoutes } from '../../../getRoutes';
import { getRouteInfoFromState } from '../../../global-state/getRouteInfoFromState';
import { navigationRef } from '../../../global-state/navigationRef';
import { Stack } from '../../../layouts/Stack';
import { NativeTabs } from '../../../native-tabs/index';
import { INTERNAL_EXPO_ROUTER_IS_PREVIEW_NAVIGATION_PARAM_NAME } from '../../../navigationParams';
import type { NavigationState } from '../../../react-navigation/native';
import { getMockContext, renderRouter } from '../../../testing-library';
import { deepEqual, getPreviewActivationPathByHref } from '../utils';

// TODO: Remove this after the logs are removed from react-native-screens
let originalConsoleInfo: typeof console.info;
beforeAll(() => {
  originalConsoleInfo = console.info;
  console.info = (...args) => {
    const message = args[0];
    if (message && typeof message === 'string') {
      if (message.includes('TabsScreen') || message.includes('BottomTabs render')) {
        // Ignore logs from react-native-screens
        return;
      }
    }
    originalConsoleInfo(...args); // Call the original console.info
  };
});
afterAll(() => {
  console.info = originalConsoleInfo;
});

const routes = {
  _layout: () => (
    <NativeTabs>
      <NativeTabs.Trigger name="index" />
      <NativeTabs.Trigger name="faces" />
      <NativeTabs.Trigger name="explore" />
    </NativeTabs>
  ),
  index: () => null,
  'faces/_layout': () => <Stack />,
  'faces/index': () => null,
  'faces/[face]': () => null,
  'explore/_layout': () => <Stack />,
  'explore/index': () => null,
  'explore/news/_layout': () => <Stack />,
  'explore/news/index': () => null,
  'explore/news/[title]': () => null,
};
const context = getMockContext(routes);
const routeNode = getRoutes(context, {
  ignoreEntryPoints: true,
  platform: 'ios',
  preserveRedirectAndRewrites: true,
  skipGenerated: true,
})!;
const linking = getLinkingConfig(routeNode, context, {
  metaOnly: false,
  redirects: [],
  skipGenerated: false,
  sitemap: true,
  notFound: true,
});
const getRouteInfo = () => getRouteInfoFromState(navigationRef.getRootState());

describe('deepEqual', () => {
  it('returns true for same object reference', () => {
    const obj = { a: 1 };
    expect(deepEqual(obj, obj)).toBe(true);
  });

  it('returns true for deeply equal objects', () => {
    const a = { x: 1, y: { z: 2 } };
    const b = { x: 1, y: { z: 2 } };
    expect(deepEqual(a, b)).toBe(true);
  });

  it('returns false for objects with different keys', () => {
    const a = { x: 1 };
    const b = { x: 1, y: 2 };
    expect(deepEqual(a, b)).toBe(false);
  });

  it('returns false for objects with different values', () => {
    const a = { x: 1 };
    const b = { x: 2 };
    expect(deepEqual(a, b)).toBe(false);
  });

  it('returns false if one is null', () => {
    type DeepEqualParam = Parameters<typeof deepEqual>[0];
    expect(deepEqual(null as unknown as DeepEqualParam, { a: 1 })).toBe(false);
    expect(deepEqual({ a: 1 }, null as unknown as DeepEqualParam)).toBe(false);
  });

  it('returns false if both are null', () => {
    type DeepEqualParam = Parameters<typeof deepEqual>[0];
    expect(deepEqual(null as unknown as DeepEqualParam, null as unknown as DeepEqualParam)).toBe(
      true
    );
  });

  it('returns false for non-object types', () => {
    type DeepEqualParam = Parameters<typeof deepEqual>[0];
    expect(deepEqual(1 as unknown as DeepEqualParam, { a: 1 })).toBe(false);
    expect(deepEqual({ a: 1 }, 1 as unknown as DeepEqualParam)).toBe(false);
    expect(
      deepEqual('test' as unknown as DeepEqualParam, 'test' as unknown as DeepEqualParam)
    ).toBe(true);
  });

  it('returns true for deeply nested equal objects', () => {
    const a = { a: { b: { c: 3 } } };
    const b = { a: { b: { c: 3 } } };
    expect(deepEqual(a, b)).toBe(true);
  });

  it('returns false for deeply nested unequal objects', () => {
    const a = { a: { b: { c: 3 } } };
    const b = { a: { b: { c: 4 } } };
    expect(deepEqual(a, b)).toBe(false);
  });

  it('returns true for empty objects', () => {
    expect(deepEqual({}, {})).toBe(true);
  });
});

describe(getPreviewActivationPathByHref, () => {
  let getStateForHref: jest.SpyInstance | undefined;

  beforeEach(() => {
    renderRouter(routes);
  });

  afterEach(() => {
    getStateForHref?.mockRestore();
    getStateForHref = undefined;
  });

  const getActivationPath = (href: string, state: NavigationState) =>
    getPreviewActivationPathByHref(href, state, getRouteInfo(), linking);

  function createState({
    selectedTab = 'faces',
    focusedFace,
  }: { selectedTab?: string; focusedFace?: string } = {}): NavigationState {
    const faceRoutes: NavigationState['routes'] = [
      { key: 'faces-index', name: 'index' },
      { key: 'face-preloaded', name: '[face]', params: { face: '1e3a8a' } },
    ];
    if (focusedFace) {
      faceRoutes.push({
        key: 'face-focused',
        name: '[face]',
        params: { face: focusedFace },
      });
    }
    const selectedTabIndex = selectedTab === 'index' ? 0 : 1;
    return {
      stale: false,
      routeKeySeq: 0,
      key: 'root-stack',
      index: 0,
      routeNames: ['__root'],
      routes: [
        {
          key: 'root-route',
          name: '__root',
          state: {
            stale: false,
            routeKeySeq: 0,
            key: 'root-tabs',
            index: selectedTabIndex,
            routeNames: ['index', 'faces'],
            history: [
              {
                type: 'route',
                key: selectedTab === 'index' ? 'index-tab' : 'faces-tab',
              },
            ],
            routes: [
              { key: 'index-tab', name: 'index', path: '/' },
              {
                key: 'faces-tab',
                name: 'faces',
                state: {
                  stale: false,
                  routeKeySeq: 0,
                  key: 'faces-stack',
                  index: focusedFace ? faceRoutes.length - 1 : 0,
                  routeNames: ['index', '[face]'],
                  routes: faceRoutes,
                },
              },
            ],
          },
        },
      ],
    };
  }

  it('returns the path to a preloaded route in the focused stack', () => {
    expect(getActivationPath('/faces/1e3a8a', createState())).toEqual([
      { key: 'root-route', name: '__root' },
      { key: 'faces-tab', name: 'faces' },
      { key: 'face-preloaded', name: '[face]' },
    ]);
  });

  it('returns the path to a preloaded route in another tab', () => {
    expect(getActivationPath('/faces/1e3a8a', createState({ selectedTab: 'index' }))).toEqual([
      { key: 'root-route', name: '__root' },
      { key: 'faces-tab', name: 'faces' },
      { key: 'face-preloaded', name: '[face]' },
    ]);
  });

  it('returns undefined when the destination is already focused', () => {
    const state = createState({ focusedFace: '1e3a8a' });
    expect(getActivationPath('/faces/1e3a8a', state)).toBeUndefined();
  });

  it('ends at the tab route when only the tab needs to change', () => {
    const state = createState({ selectedTab: 'index' });
    const facesRoute = state.routes[0]!.state!.routes[1]!;
    delete facesRoute.state;

    expect(getActivationPath('/faces', state)).toEqual([
      { key: 'root-route', name: '__root' },
      { key: 'faces-tab', name: 'faces' },
    ]);
  });

  it('includes the destination already focused inside another tab', () => {
    expect(
      getActivationPath(
        '/faces/1e3a8a',
        createState({ selectedTab: 'index', focusedFace: '1e3a8a' })
      )
    ).toEqual([
      { key: 'root-route', name: '__root' },
      { key: 'faces-tab', name: 'faces' },
      { key: 'face-focused', name: '[face]' },
    ]);
  });

  it('ignores a matching sibling before the focused route', () => {
    expect(
      getActivationPath('/faces/1e3a8a', createState({ focusedFace: 'other' }))
    ).toBeUndefined();
  });

  it('returns an outer-first path through nested tabs', () => {
    getStateForHref = jest.spyOn(linking, 'getStateFromPath').mockReturnValue({
      routes: [
        {
          name: 'root',
          state: {
            routes: [
              {
                name: 'section',
                state: { routes: [{ name: 'details' }] },
              },
            ],
          },
        },
      ],
    });
    const state: NavigationState = {
      stale: false,
      routeKeySeq: 0,
      key: 'root-stack',
      index: 0,
      routeNames: ['root'],
      routes: [
        {
          key: 'root-route',
          name: 'root',
          state: {
            stale: false,
            routeKeySeq: 0,
            key: 'outer-tabs',
            index: 0,
            routeNames: ['home', 'section'],
            history: [{ type: 'route', key: 'home-tab' }],
            routes: [
              { key: 'home-tab', name: 'home' },
              {
                key: 'section-tab',
                name: 'section',
                state: {
                  stale: false,
                  routeKeySeq: 0,
                  key: 'inner-tabs',
                  index: 0,
                  routeNames: ['feed', 'details'],
                  history: [{ type: 'route', key: 'feed-tab' }],
                  routes: [
                    { key: 'feed-tab', name: 'feed' },
                    { key: 'details-tab', name: 'details' },
                  ],
                },
              },
            ],
          },
        },
      ],
    };

    expect(getActivationPath('/nested', state)).toEqual([
      { key: 'root-route', name: 'root' },
      { key: 'section-tab', name: 'section' },
      { key: 'details-tab', name: 'details' },
    ]);
  });

  it('matches the preloaded route by nested state shape', () => {
    getStateForHref = jest.spyOn(linking, 'getStateFromPath').mockReturnValue({
      routes: [
        {
          name: 'details',
          params: { id: 'one' },
          state: {
            routes: [{ name: 'child', params: { filter: 'target' } }],
          },
        },
      ],
    });
    const matchingRoute = {
      key: 'details-matching',
      name: 'details',
      params: {
        id: 'one',
        [INTERNAL_EXPO_ROUTER_IS_PREVIEW_NAVIGATION_PARAM_NAME]: true,
      },
      state: {
        key: 'child-stack-generated',
        index: 0,
        routeNames: ['child'],
        routes: [
          {
            key: 'child-generated',
            name: 'child',
            params: {
              filter: 'target',
              [INTERNAL_EXPO_ROUTER_IS_PREVIEW_NAVIGATION_PARAM_NAME]: true,
            },
          },
        ],
        stale: false as const,
        routeKeySeq: 0,
      },
    };
    const state = {
      key: 'root-stack',
      index: 0,
      routeNames: ['details'],
      routes: [
        {
          key: 'details-active',
          name: 'details',
          params: { id: 'one' },
          state: {
            key: 'active-child-stack',
            index: 0,
            routeNames: ['child'],
            routes: [
              {
                key: 'active-child',
                name: 'child',
                params: { filter: 'active' },
              },
            ],
            stale: false as const,
            routeKeySeq: 0,
          },
        },
        {
          key: 'details-wrong',
          name: 'details',
          params: { id: 'one' },
          state: {
            key: 'wrong-child-stack',
            index: 0,
            routeNames: ['child'],
            routes: [
              {
                key: 'wrong-child',
                name: 'child',
                params: { filter: 'wrong' },
              },
            ],
            stale: false as const,
            routeKeySeq: 0,
          },
        },
        matchingRoute,
      ],
      stale: false as const,
      routeKeySeq: 0,
    };

    expect(getActivationPath('/details', state)).toEqual([
      { key: matchingRoute.key, name: matchingRoute.name },
    ]);
  });

  it('does not match a preloaded route from a different branch', () => {
    getStateForHref = jest.spyOn(linking, 'getStateFromPath').mockReturnValue({
      routes: [
        {
          name: 'target',
          state: { routes: [{ name: 'child', params: { filter: 'target' } }] },
        },
      ],
    });
    const unrelatedPreloadedRoute = {
      key: 'child-preloaded',
      name: 'child',
      params: { filter: 'target' },
    };
    const state = {
      key: 'root-stack',
      index: 0,
      routeNames: ['current', 'target'],
      routes: [
        {
          key: 'current',
          name: 'current',
          state: {
            key: 'current-stack',
            index: 0,
            routeNames: ['index', 'child'],
            routes: [{ key: 'index', name: 'index' }, unrelatedPreloadedRoute],
            stale: false as const,
            routeKeySeq: 0,
          },
        },
      ],
      stale: false as const,
      routeKeySeq: 0,
    };

    expect(getActivationPath('/target/child', state)).toBeUndefined();
  });
});
