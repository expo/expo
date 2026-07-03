import type { NavigationState, PartialState } from '../../react-navigation/native';
import { findDivergentState, getPayloadFromStateRoute } from '../stateUtils';

// React Navigation converts nested action states into a flat `{ screen, params: { screen, params: ... } }`
// structure. `getPayloadFromStateRoute` mirrors this by merging params at each level so the
// dispatch payload matches what React Navigation expects.
// TODO(@ubax): validate if params bubbling behavior is consistent with React Navigation and expected here
describe('getPayloadFromStateRoute', () => {
  it('returns empty payload for empty route', () => {
    const result = getPayloadFromStateRoute({});
    expect(result).toEqual({ params: {} });
  });

  it('extracts screen name from a single route', () => {
    const result = getPayloadFromStateRoute({
      name: 'home',
    });

    expect(result).toEqual({ screen: 'home', params: {} });
  });

  it('preserves params from a single route', () => {
    const result = getPayloadFromStateRoute({
      name: 'profile',
      params: { id: '123', color: 'blue' },
    });

    expect(result).toEqual({ screen: 'profile', params: { id: '123', color: 'blue' } });
  });

  it('traverses nested routes and nests params correctly', () => {
    const route = {
      name: 'tabs',
      params: { tabParam: 'a' },
      state: {
        routes: [
          {
            name: 'settings',
            params: { section: 'general' },
          },
        ],
      },
    };

    const result = getPayloadFromStateRoute(route);

    expect(result).toEqual({
      screen: 'tabs',
      params: {
        tabParam: 'a',
        screen: 'settings',
        section: 'general',
        params: { tabParam: 'a', section: 'general' },
      },
    });
  });

  it('uses the last route in state.routes when traversing', () => {
    const route = {
      name: 'stack',
      state: {
        routes: [{ name: 'first' }, { name: 'second' }, { name: 'third', params: { value: '42' } }],
      },
    };

    const result = getPayloadFromStateRoute(route);

    expect(result).toEqual({
      screen: 'stack',
      params: { screen: 'third', value: '42', params: { value: '42' } },
    });
  });

  it('handles deeply nested routes (3 levels)', () => {
    const route = {
      name: 'root',
      state: {
        routes: [
          {
            name: 'middle',
            state: {
              routes: [
                {
                  name: 'leaf',
                  params: { leafParam: 'deep' },
                },
              ],
            },
          },
        ],
      },
    };

    const result = getPayloadFromStateRoute(route);

    expect(result.screen).toBe('root');
    expect(result.params.screen).toBe('middle');
    // Leaf screen and params are nested one level deeper (React Nav merges after first layer)
    expect(result.params.params.screen).toBe('leaf');
    expect(result.params.params.leafParam).toBe('deep');
  });

  it('does not forward "screen" key in params at any level', () => {
    const route = {
      name: 'parent',
      params: { screen: 'shouldBeRemoved', keepMe: 'yes' },
      state: {
        routes: [{ name: 'child' }],
      },
    };

    const result = getPayloadFromStateRoute(route);

    // The screen key in params is replaced by the child screen name
    expect(result).toEqual({
      params: { keepMe: 'yes', screen: 'child', params: { keepMe: 'yes' } },
      screen: 'parent',
    });
  });
});

describe('findDivergentState', () => {
  // A single route with no child state means we're already at the leaf — divergence is
  // immediate because there's nothing deeper to compare.
  it('returns early when action state has no child state (single route)', () => {
    const actionState: PartialState<NavigationState> = {
      routes: [{ name: 'home' }],
    };

    const navState: NavigationState = {
      routes: [{ key: 'home-key', name: 'home' }],
      index: 0,
      key: 'nav-0',
      routeNames: ['home'],
      stale: false,
    };

    const result = findDivergentState(actionState, navState);

    // Since the action state route has no child state, it diverges immediately
    expect(result.actionStateRoute?.name).toBe('home');
    expect(result.navigationState).toBeDefined();
  });

  it('detects divergence when route names differ', () => {
    const actionState: PartialState<NavigationState> = {
      routes: [
        {
          name: 'root',
          state: {
            routes: [{ name: 'settings' }],
          },
        },
      ],
    };

    const navState: NavigationState = {
      routes: [
        {
          key: 'root-key',
          name: 'root',
          state: {
            routes: [{ key: 'home-key', name: 'home' }],
            index: 0,
            key: 'nav-1',
            routeNames: ['home'],
            stale: false,
          },
        },
      ],
      index: 0,
      key: 'nav-0',
      routeNames: ['root'],
      stale: false,
    };

    const result = findDivergentState(actionState, navState);

    // Should diverge at the second level where 'settings' !== 'home'
    expect(result.actionStateRoute?.name).toBe('settings');
    expect(result.navigationState).toBeDefined();
    expect(result.navigationRoutes).toHaveLength(1);
    expect(result.navigationRoutes[0]!.name).toBe('root');
  });

  it('returns the full path when routes are the same (no child state divergence)', () => {
    // When action and navigation states have matching route names all the way down,
    // divergence happens at the leaf node where `actionStateRoute` has no child state.
    const actionState: PartialState<NavigationState> = {
      routes: [
        {
          name: 'root',
          state: {
            routes: [{ name: 'home' }],
          },
        },
      ],
    };

    const navState: NavigationState = {
      routes: [
        {
          key: 'root-key',
          name: 'root',
          state: {
            routes: [{ key: 'home-key', name: 'home' }],
            index: 0,
            key: 'nav-inner',
            routeNames: ['home'],
            stale: false,
          },
        },
      ],
      index: 0,
      key: 'nav-root',
      routeNames: ['root'],
      stale: false,
    };

    const result = findDivergentState(actionState, navState);

    // Action state route 'home' has no child state, so it diverges at the leaf
    expect(result.actionStateRoute?.name).toBe('home');
    // navigationRoutes should include 'root' since that matched
    expect(result.navigationRoutes).toHaveLength(1);
    expect(result.navigationRoutes[0]!.name).toBe('root');
  });

  it('detects divergence on dynamic segments with different param values', () => {
    const actionState: PartialState<NavigationState> = {
      routes: [
        {
          name: '[id]',
          params: { id: '456' },
          state: {
            routes: [{ name: 'details' }],
          },
        },
      ],
    };

    const navState: NavigationState = {
      routes: [
        {
          key: 'id-key',
          name: '[id]',
          params: { id: '123' },
          state: {
            routes: [{ key: 'details-key', name: 'details' }],
            index: 0,
            key: 'nav-inner',
            routeNames: ['details'],
            stale: false,
          },
        },
      ],
      index: 0,
      key: 'nav-root',
      routeNames: ['[id]'],
      stale: false,
    };

    const result = findDivergentState(actionState, navState);

    // Should diverge at [id] because param values differ (456 vs 123)
    expect(result.actionStateRoute?.name).toBe('[id]');
    // No navigation routes should have been collected before divergence
    expect(result.navigationRoutes).toHaveLength(0);
  });

  it('does not diverge on dynamic segments with the same param values', () => {
    const actionState: PartialState<NavigationState> = {
      routes: [
        {
          name: '[id]',
          params: { id: '123' },
          state: {
            routes: [{ name: 'details' }],
          },
        },
      ],
    };

    const navState: NavigationState = {
      routes: [
        {
          key: 'id-key',
          name: '[id]',
          params: { id: '123' },
          state: {
            routes: [{ key: 'details-key', name: 'details' }],
            index: 0,
            key: 'nav-inner',
            routeNames: ['details'],
            stale: false,
          },
        },
      ],
      index: 0,
      key: 'nav-root',
      routeNames: ['[id]'],
      stale: false,
    };

    const result = findDivergentState(actionState, navState);

    // Should NOT diverge at [id] since params match, should proceed to details
    expect(result.actionStateRoute?.name).toBe('details');
    expect(result.navigationRoutes).toHaveLength(1);
    expect(result.navigationRoutes[0]!.name).toBe('[id]');
  });

  it('diverges at intermediate route when names differ mid-tree', () => {
    const actionState: PartialState<NavigationState> = {
      routes: [
        {
          name: 'root',
          state: {
            routes: [
              {
                name: 'branch-a',
                state: {
                  routes: [{ name: 'leaf' }],
                },
              },
            ],
          },
        },
      ],
    };

    const navState: NavigationState = {
      routes: [
        {
          key: 'root-key',
          name: 'root',
          state: {
            routes: [
              {
                key: 'branch-b-key',
                name: 'branch-b',
                state: {
                  routes: [{ key: 'leaf-key', name: 'leaf' }],
                  index: 0,
                  key: 'nav-leaf',
                  routeNames: ['leaf'],
                  stale: false,
                },
              },
            ],
            index: 0,
            key: 'nav-branch',
            routeNames: ['branch-b'],
            stale: false,
          },
        },
      ],
      index: 0,
      key: 'nav-root',
      routeNames: ['root'],
      stale: false,
    };

    const result = findDivergentState(actionState, navState);

    // Should diverge at branch level where branch-a !== branch-b
    expect(result.actionStateRoute?.name).toBe('branch-a');
    // Only root matched before divergence
    expect(result.navigationRoutes).toHaveLength(1);
    expect(result.navigationRoutes[0]!.name).toBe('root');
  });

  // `tabNavigatorKeys` holds the state keys of tab navigators that are React ancestors of the
  // preview link (captured from NavigatorTypeContext). When the current navigator's key is in the
  // set, the traversal looks through all of that navigator's routes (not just the focused one),
  // which is what enables cross-tab link-preview navigation.
  describe('tabNavigatorKeys', () => {
    // A tab navigator whose target tab is not the focused one. Navigating to a nested route in the
    // 'settings' tab while 'home' is focused.
    const tabActionState: PartialState<NavigationState> = {
      routes: [
        {
          name: 'settings',
          state: {
            routes: [{ name: 'page' }],
          },
        },
      ],
    };
    const tabNavState: NavigationState = {
      routes: [
        { key: 'home-key', name: 'home' },
        {
          key: 'settings-key',
          name: 'settings',
          state: {
            routes: [{ key: 'page-key', name: 'page' }],
            index: 0,
            key: 'nav-settings',
            routeNames: ['page'],
            stale: false,
          },
        },
      ],
      index: 0, // Currently on 'home' tab
      key: 'nav-tabs',
      routeNames: ['home', 'settings'],
      stale: false,
    };

    it('looks through all routes when the navigator key is in tabNavigatorKeys', () => {
      const result = findDivergentState(
        tabActionState,
        tabNavState,
        new Set(['nav-tabs'])
      );

      // Look-through finds the non-focused 'settings' tab, descends into it, and diverges at the
      // leaf 'page' route rather than at the focused 'home' tab.
      expect(result.actionStateRoute?.name).toBe('page');
      expect(result.navigationRoutes).toHaveLength(1);
      expect(result.navigationRoutes[0]!.name).toBe('settings');
    });

    it('uses the focused route when the navigator key is not in tabNavigatorKeys (stack)', () => {
      const result = findDivergentState(tabActionState, tabNavState, new Set(['other-key']));

      // 'nav-tabs' is treated like any non-tab navigator: only the focused 'home' route is compared,
      // so 'settings' diverges immediately.
      expect(result.actionStateRoute?.name).toBe('settings');
      expect(result.navigationRoutes).toHaveLength(0);
    });

    it('uses the focused route when tabNavigatorKeys is omitted', () => {
      const result = findDivergentState(tabActionState, tabNavState);

      expect(result.actionStateRoute?.name).toBe('settings');
      expect(result.navigationRoutes).toHaveLength(0);
    });

    it('pushes the diverging tab route so the tab can be switched', () => {
      // Switching to a leaf tab ('faces') that has no child state. At divergence the target tab
      // route must be pushed so callers can compute the new tab key.
      const actionState: PartialState<NavigationState> = {
        routes: [{ name: 'faces' }],
      };
      const navState: NavigationState = {
        routes: [
          { key: 'home-key', name: 'home' },
          { key: 'faces-key', name: 'faces' },
        ],
        index: 0,
        key: 'nav-tabs',
        routeNames: ['home', 'faces'],
        stale: false,
      };

      const result = findDivergentState(actionState, navState, new Set(['nav-tabs']));

      expect(result.actionStateRoute?.name).toBe('faces');
      expect(result.navigationRoutes).toHaveLength(1);
      expect(result.navigationRoutes[0]!.key).toBe('faces-key');
    });

    it('falls back to the focused route when the tab name is not found', () => {
      const actionState: PartialState<NavigationState> = {
        routes: [{ name: 'unknown-tab' }],
      };
      const navState: NavigationState = {
        routes: [
          { key: 'home-key', name: 'home' },
          { key: 'settings-key', name: 'settings' },
        ],
        index: 0,
        key: 'nav-tabs',
        routeNames: ['home', 'settings'],
        stale: false,
      };

      const result = findDivergentState(actionState, navState, new Set(['nav-tabs']));

      // Falls back to index 0 (home); diverges because 'unknown-tab' !== 'home'.
      expect(result.actionStateRoute?.name).toBe('unknown-tab');
    });
  });
});
