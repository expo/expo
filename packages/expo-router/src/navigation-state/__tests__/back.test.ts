import { resolveBack } from '../back';
import { reduce } from '../reducer';
import { __resetRouterRegistryForTests, registerRouter } from '../routerRegistry';
import { stackRouter, tabsRouter } from '../routers';
import type { GlobalNavState, NavNode } from '../types';

// Render-free back-bubbling (Decisions R-13/P-8): bubble the focused chain, run each node's registered
// router with goBack; tabs translate focus-order → goBackTo. Returns {key,next} or {exit:true}.

afterEach(__resetRouterRegistryForTests);

const stack = (names: string[], index = names.length - 1): NavNode => ({
  key: 'home.stack',
  index,
  routes: names.map((n) => ({ key: `${n}#k`, name: n })),
});

const rootWith = (tabNames: string[], focusedTab: number, childStack: NavNode): GlobalNavState => ({
  root: {
    key: 'root',
    index: focusedTab,
    routes: tabNames.map((name, i) => ({
      key: `${name}#${i}`,
      name,
      child: i === focusedTab ? childStack : { key: `${name}.stack`, index: 0, routes: [] },
    })),
  },
});

it('scenario 5 — the focused stack pops (remove + index--)', () => {
  registerRouter('root', tabsRouter);
  registerRouter('home.stack', stackRouter);
  const state = rootWith(['home', 'search'], 0, stack(['index', 'list', 'details']));
  const result = resolveBack(state);
  expect('key' in result && result.key).toBe('home.stack');
  const after = reduce(state, { ...(result as { key: string; next: NavNode }), source: 'js' });
  expect(after.root.routes[0]!.child!.routes.map((r) => r.name)).toEqual(['index', 'list']);
});

it('scenario 6 — bubbles past a root-level stack to tabs, which refocuses via focus-order', () => {
  registerRouter('root', tabsRouter);
  registerRouter('home.stack', stackRouter);
  const state = rootWith(['home', 'search'], 1, stack(['index'])); // search focused, its stack at root
  const result = resolveBack(state, ['home', 'search']);
  expect(result).toEqual({ key: 'root', next: { ...state.root, index: 0 } });
});

it('exits when nothing handles back (no focus-order)', () => {
  registerRouter('root', tabsRouter);
  registerRouter('home.stack', stackRouter);
  expect(resolveBack(rootWith(['home', 'search'], 1, stack(['index'])))).toEqual({ exit: true });
});

it('bubbles past a node with no registered router', () => {
  registerRouter('root', tabsRouter); // home.stack NOT registered
  expect(resolveBack(rootWith(['home', 'search'], 0, stack(['index'])))).toEqual({ exit: true });
});
