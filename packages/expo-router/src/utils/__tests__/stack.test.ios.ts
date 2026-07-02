import { isRoutePreloadedInStack } from '../stack';

const state = {
  index: 0,
  routes: [{ key: 'a' }, { key: 'b' }],
} as any;

it('reports a route after the focused index as preloaded in a stack', () => {
  expect(isRoutePreloadedInStack(state, { key: 'b' }, 'stack')).toBe(true);
  expect(isRoutePreloadedInStack(state, { key: 'a' }, 'stack')).toBe(false);
});

it('never reports preloaded outside a stack navigator', () => {
  // In tab-like navigators every present route is loaded, not preloaded.
  expect(isRoutePreloadedInStack(state, { key: 'b' }, 'tab')).toBe(false);
  expect(isRoutePreloadedInStack(state, { key: 'b' }, undefined)).toBe(false);
});
