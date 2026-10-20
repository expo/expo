import type { RouterRegistryEntry } from '../../../global-state/routerRegistry';
import type { NavigationState } from '../../routers';
import { getCanDismiss } from '../CanDismissContext';

describe('getCanDismiss', () => {
  // Navigation states have no `type`, so each test registers the router type by state key.
  const registry = new Map<string, RouterRegistryEntry>([
    ['stack', { reduce: () => null, type: 'stack' }],
    ['nested-stack', { reduce: () => null, type: 'stack' }],
    ['tab', { reduce: () => null, type: 'tab' }],
    ['nested-tab', { reduce: () => null, type: 'tab' }],
  ]);

  type Route = { name: string; state?: NavigationState };

  function state(key: string, routes: Route[], index = 0): NavigationState {
    return {
      key,
      index,
      routeNames: routes.map((route) => route.name),
      routes: routes.map((route) => ({ key: route.name, ...route })),
      stale: false,
      routeKeySeq: 0,
    };
  }

  it('returns false for single-route stack', () => {
    expect(getCanDismiss(state('stack', [{ name: 'home' }]), registry)).toBe(false);
  });

  it('returns true when the stack index is above 0', () => {
    expect(getCanDismiss(state('stack', [{ name: 'home' }, { name: 'detail' }], 1), registry)).toBe(
      true
    );
  });

  it('returns false for tab with >1 routes', () => {
    expect(getCanDismiss(state('tab', [{ name: 'home' }, { name: 'detail' }], 1), registry)).toBe(
      false
    );
  });

  it('returns false for an unregistered navigator with >1 routes', () => {
    expect(
      getCanDismiss(state('unknown', [{ name: 'home' }, { name: 'detail' }], 1), registry)
    ).toBe(false);
  });

  it('traverses nested navigators (tab → stack with 2 routes → true)', () => {
    const stack = state('stack', [{ name: 'page1' }, { name: 'page2' }], 1);
    expect(getCanDismiss(state('tab', [{ name: 'tab1', state: stack }]), registry)).toBe(true);
  });

  it('returns false for a tab whose focused stack has one screen', () => {
    const stack = state('stack', [{ name: 'only-page' }]);
    expect(getCanDismiss(state('tab', [{ name: 'tab1', state: stack }]), registry)).toBe(false);
  });

  it('ignores stacks in unfocused routes', () => {
    const stack = state('stack', [{ name: 'page1' }, { name: 'page2' }], 1);
    expect(
      getCanDismiss(state('tab', [{ name: 'tab1' }, { name: 'tab2', state: stack }]), registry)
    ).toBe(false);
  });

  it('traverses deeply nested navigators (tab → stack → tab → stack with 2 routes)', () => {
    const innerStack = state('nested-stack', [{ name: 'page1' }, { name: 'page2' }], 1);
    const nestedTab = state('nested-tab', [{ name: 'inner-tab', state: innerStack }]);
    const stack = state('stack', [{ name: 'nested-tab', state: nestedTab }]);
    expect(getCanDismiss(state('tab', [{ name: 'tab1', state: stack }]), registry)).toBe(true);
  });
});
