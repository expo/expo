import { resolveNavigate } from '../actions';
import { __resetRouterRegistryForTests, registerRouter } from '../routerRegistry';
import { stackRouter, tabsRouter } from '../routers';
import type { GlobalNavState, NavNode } from '../types';

// Forward navigation (Decisions R-13): walk current vs a hydrated target, running each node's
// registered router. Returns the new root, or null. Routers are looked up by node key.

afterEach(__resetRouterRegistryForTests);

const stack = (key: string, names: string[]): NavNode => ({
  key,
  index: names.length - 1,
  routes: names.map((n) => ({ key: `${key}:${n}`, name: n })),
});

const tabs = (
  names: string[],
  index: number,
  children: Record<string, NavNode>
): GlobalNavState => ({
  root: {
    key: 'root',
    index,
    routes: names.map((n) => ({ key: `${n}#k`, name: n, child: children[n] })),
  },
});

it('pushes into the focused stack (stack-rooted app)', () => {
  registerRouter('home.stack', stackRouter);
  const current: GlobalNavState = { root: stack('home.stack', ['index']) };
  const target: GlobalNavState = { root: stack('home.stack', ['index', 'details']) };
  const next = resolveNavigate(current, target)!;
  expect(next.routes.map((r) => r.name)).toEqual(['index', 'details']);
  expect(next.index).toBe(1);
});

it('promotes another tab, grafting its hydrated subtree (cross-tab, the C12 hybrid)', () => {
  registerRouter('root', tabsRouter);
  const current = tabs(['home'], 0, { home: stack('home.stack', ['index']) });
  const searchChild = stack('search.stack', ['index']);
  const target = tabs(['search'], 0, { search: searchChild });
  const next = resolveNavigate(current, target)!;
  expect(next.routes.map((r) => r.name)).toEqual(['home', 'search']); // home retained
  expect(next.index).toBe(1);
  expect(next.routes[1]!.child).toBe(searchChild); // grafted from the hydrated payload
});

it('descends into an existing tab and navigates its child stack', () => {
  registerRouter('root', tabsRouter);
  registerRouter('home.stack', stackRouter);
  const current = tabs(['home'], 0, { home: stack('home.stack', ['index']) });
  const target = tabs(['home'], 0, { home: stack('home.stack', ['index', 'details']) });
  const next = resolveNavigate(current, target)!;
  expect(next.routes[0]!.child!.routes.map((r) => r.name)).toEqual(['index', 'details']);
  expect(next.index).toBe(0); // home stays focused
});

it('grafts the hydrated child when navigating deeper into an existing childless route', () => {
  registerRouter('root', tabsRouter);
  // `home` is currently a leaf (no nested navigator); the target goes deeper into it.
  const current: GlobalNavState = {
    root: { key: 'root', index: 0, routes: [{ key: 'home#k', name: 'home' }] },
  };
  const homeChild = stack('home.stack', ['index', 'details']);
  const target: GlobalNavState = {
    root: { key: 'root', index: 0, routes: [{ key: 'home#k', name: 'home', child: homeChild }] },
  };
  const next = resolveNavigate(current, target)!;
  expect(next.routes[0]!.child).toBe(homeChild); // grafted, not dropped
});

it('returns null when nothing changes', () => {
  registerRouter('home.stack', stackRouter);
  const current: GlobalNavState = { root: stack('home.stack', ['index']) };
  expect(resolveNavigate(current, { root: stack('home.stack', ['index']) })).toBeNull();
});
