import type { NavigationState, PartialState } from '../../react-navigation/native';
import { findDivergentState, getNavigationPayloadFromStateRoute } from '../stateUtils';

describe('getNavigationPayloadFromStateRoute', () => {
  it('returns route params and propagates them through the emitted child state', () => {
    const result = getNavigationPayloadFromStateRoute(
      {
        name: 'profile',
        params: { id: '123', screen: 'ignored', initial: false },
        state: {
          stale: false,
          key: '@:profile:0',
          index: 0,
          routeNames: ['details'],
          routes: [{ key: '@:profile:0:details:0', name: 'details' }],
        },
      },
      {
        key: '@',
        index: 0,
        routeNames: ['index'],
        routes: [{ key: '@:index:0', name: 'index' }],
        stale: false,
      }
    );

    expect(result).toEqual({
      name: 'profile',
      params: { id: '123' },
      state: {
        stale: false,
        key: '@:profile:0',
        index: 0,
        routeNames: ['details'],
        routes: [{ key: '@:profile:0:details:0', name: 'details', params: { id: '123' } }],
      },
    });
  });

  it('rekeys duplicate-name subtrees against the live target state', () => {
    const result = getNavigationPayloadFromStateRoute(
      {
        name: 'bar',
        state: {
          stale: false,
          key: '@:bar:0',
          index: 0,
          routeNames: ['baz'],
          routes: [
            {
              key: '@:bar:0:baz:0',
              name: 'baz',
              state: {
                stale: false,
                key: '@:bar:0:baz:0',
                index: 0,
                routeNames: ['leaf'],
                routes: [{ key: '@:bar:0:baz:0:leaf:0', name: 'leaf' }],
              },
            },
          ],
        },
      },
      {
        key: '@',
        index: 0,
        routeNames: ['bar'],
        routes: [{ key: '@:bar:0', name: 'bar' }],
        stale: false,
      }
    );

    expect(result.state?.key).toBe('@:bar:1');
    expect(result.state?.routes[0]?.key).toBe('@:bar:1:baz:0');
    expect(result.state?.routes[0]?.state?.key).toBe('@:bar:1:baz:0');
    expect(result.state?.routes[0]?.state?.routes[0]?.key).toBe('@:bar:1:baz:0:leaf:0');
  });

  it('propagates extra internal params through the focused emitted subtree', () => {
    const result = getNavigationPayloadFromStateRoute(
      {
        name: 'modal',
        params: { id: '123' },
        state: {
          stale: false,
          key: '@:modal:0',
          index: 0,
          routeNames: ['leaf'],
          routes: [{ key: '@:modal:0:leaf:0', name: 'leaf' }],
        },
      },
      {
        key: '@',
        index: 0,
        routeNames: ['index'],
        routes: [{ key: '@:index:0', name: 'index' }],
        stale: false,
      },
      { __internal__expo_router_is_preview_navigation: true }
    );

    expect(result.params).toEqual({
      id: '123',
      __internal__expo_router_is_preview_navigation: true,
    });
    expect(result.state?.routes[0]?.params).toEqual({
      id: '123',
      __internal__expo_router_is_preview_navigation: true,
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
