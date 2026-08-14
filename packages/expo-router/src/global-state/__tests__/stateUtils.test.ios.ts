import type { ResultState } from '../../fork/getStateFromPath';
import type { NavigationState } from '../../react-navigation/native';
import { findDivergentState } from '../stateUtils';

describe('findDivergentState', () => {
  // A single route with no child state means we're already at the leaf — divergence is
  // immediate because there's nothing deeper to compare.
  it('returns early when action state has no child state (single route)', () => {
    const actionState: ResultState = {
      routes: [{ name: 'home' }],
    };

    const navState: NavigationState = {
      routes: [{ key: 'home-key', name: 'home' }],
      index: 0,
      key: 'nav-0',
      type: 'stack',
      routeNames: ['home'],
      stale: false,
    };

    const result = findDivergentState(actionState, navState);

    // Since the action state route has no child state, it diverges immediately
    expect(result.actionStateRoute?.name).toBe('home');
    expect(result.navigationState).toBeDefined();
  });

  it('detects divergence when route names differ', () => {
    const actionState: ResultState = {
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
            type: 'stack',
            routeNames: ['home'],
            stale: false,
          },
        },
      ],
      index: 0,
      key: 'nav-0',
      type: 'stack',
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
    const actionState: ResultState = {
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
            type: 'stack',
            routeNames: ['home'],
            stale: false,
          },
        },
      ],
      index: 0,
      key: 'nav-root',
      type: 'stack',
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
    const actionState: ResultState = {
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
            type: 'stack',
            routeNames: ['details'],
            stale: false,
          },
        },
      ],
      index: 0,
      key: 'nav-root',
      type: 'stack',
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
    const actionState: ResultState = {
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
            type: 'stack',
            routeNames: ['details'],
            stale: false,
          },
        },
      ],
      index: 0,
      key: 'nav-root',
      type: 'stack',
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
    const actionState: ResultState = {
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
                  type: 'stack',
                  routeNames: ['leaf'],
                  stale: false,
                },
              },
            ],
            index: 0,
            key: 'nav-branch',
            type: 'stack',
            routeNames: ['branch-b'],
            stale: false,
          },
        },
      ],
      index: 0,
      key: 'nav-root',
      type: 'stack',
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

  describe('lookThroughAllTabs', () => {
    it('finds matching tab route when lookThroughAllTabs is true', () => {
      const actionState: ResultState = {
        routes: [
          {
            name: 'settings',
            state: {
              routes: [{ name: 'page' }],
            },
          },
        ],
      };

      const navState: NavigationState = {
        routes: [
          {
            key: 'home-key',
            name: 'home',
          },
          {
            key: 'settings-key',
            name: 'settings',
            state: {
              routes: [{ key: 'page-key', name: 'page' }],
              index: 0,
              key: 'nav-settings',
              type: 'stack',
              routeNames: ['page'],
              stale: false,
            },
          },
        ],
        index: 0, // Currently on 'home' tab
        key: 'nav-tabs',
        type: 'tab',
        routeNames: ['home', 'settings'],
        stale: false,
      };

      const result = findDivergentState(actionState, navState, true);

      // Should find 'settings' tab even though current index points to 'home'
      expect(result.actionStateRoute?.name).toBe('page');
      expect(result.navigationRoutes).toHaveLength(1);
      expect(result.navigationRoutes[0]!.name).toBe('settings');
    });

    it('falls back to current index when tab name not found and lookThroughAllTabs is true', () => {
      const actionState: ResultState = {
        routes: [
          {
            name: 'unknown-tab',
          },
        ],
      };

      const navState: NavigationState = {
        routes: [
          { key: 'home-key', name: 'home' },
          { key: 'settings-key', name: 'settings' },
        ],
        index: 0,
        key: 'nav-tabs',
        type: 'tab',
        routeNames: ['home', 'settings'],
        stale: false,
      };

      const result = findDivergentState(actionState, navState, true);

      // Falls back to index 0 (home), and diverges because 'unknown-tab' !== 'home'
      expect(result.actionStateRoute?.name).toBe('unknown-tab');
    });

    it('uses current index when lookThroughAllTabs is false (default)', () => {
      const actionState: ResultState = {
        routes: [
          {
            name: 'settings',
          },
        ],
      };

      const navState: NavigationState = {
        routes: [
          { key: 'home-key', name: 'home' },
          { key: 'settings-key', name: 'settings' },
        ],
        index: 0, // Currently on 'home'
        key: 'nav-tabs',
        type: 'tab',
        routeNames: ['home', 'settings'],
        stale: false,
      };

      const result = findDivergentState(actionState, navState);

      // Should use index 0 ('home'), so it diverges because 'settings' !== 'home'
      expect(result.actionStateRoute?.name).toBe('settings');
      expect(result.navigationRoutes).toHaveLength(0);
    });

    it('adds tab route to navigationRoutes when diverging at tab level with lookThroughAllTabs', () => {
      const actionState: ResultState = {
        routes: [
          {
            name: 'settings',
          },
        ],
      };

      const navState: NavigationState = {
        routes: [
          { key: 'home-key', name: 'home' },
          { key: 'settings-key', name: 'settings' },
        ],
        index: 0,
        key: 'nav-tabs',
        type: 'tab',
        routeNames: ['home', 'settings'],
        stale: false,
      };

      const result = findDivergentState(actionState, navState, true);

      // With lookThroughAllTabs, it finds 'settings' tab. Since action has no child state, it diverges.
      // The tab route should be added to navigationRoutes.
      expect(result.actionStateRoute?.name).toBe('settings');
      expect(result.navigationRoutes).toHaveLength(1);
      expect(result.navigationRoutes[0]!.name).toBe('settings');
    });
  });

  it('stops at an unmounted child navigator', () => {
    const childState: NavigationState = {
      routes: [{ key: 'leaf-key', name: 'leaf' }],
      index: 0,
      key: 'child-nav',
      type: 'stack',
      routeNames: ['leaf'],
      stale: false,
    };
    const actionState: ResultState = {
      routes: [{ name: 'root', state: { routes: [{ name: 'leaf' }] } }],
    };
    const navState: NavigationState = {
      routes: [{ key: 'root-key', name: 'root', state: childState }],
      index: 0,
      key: 'root-nav',
      type: 'stack',
      routeNames: ['root'],
      stale: false,
    };

    const result = findDivergentState(actionState, navState, false, (key) => key !== 'child-nav');

    expect(result.navigationState.key).toBe('root-nav');
    expect(result.actionStateRoute?.name).toBe('root');
  });

  it('never returns a keyless child state', () => {
    const actionState: ResultState = {
      routes: [{ name: 'root', state: { routes: [{ name: 'leaf' }] } }],
    };
    const navState: NavigationState = {
      routes: [
        {
          key: 'root-key',
          name: 'root',
          state: {
            routes: [{ key: 'leaf-key', name: 'leaf' }],
            index: 0,
            type: 'stack',
            routeNames: ['leaf'],
          },
        },
      ],
      index: 0,
      key: 'root-nav',
      type: 'stack',
      routeNames: ['root'],
      stale: false,
    };

    expect(findDivergentState(actionState, navState).navigationState.key).toBe('root-nav');
  });
});
