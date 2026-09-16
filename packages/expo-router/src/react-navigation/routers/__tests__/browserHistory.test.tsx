import {
  CommonActions,
  DrawerActions,
  DrawerRouter,
  StackActions,
  StackRouter,
  TabRouter,
} from '..';
import type { NavigationState } from '..';

const options = { routeNames: ['index', 'details', 'final'], routeGetIdList: {} };
const stack = {
  stale: false,
  type: 'stack' as const,
  key: 'navigator:root',
  routeKeySeq: 0,
  index: 0,
  routeNames: options.routeNames,
  routes: [{ key: 'index', name: 'index' }],
} satisfies NavigationState;

test('stack pushes and pops describe browser traversal, excluding preloads and replacements', () => {
  const router = StackRouter({});
  const preloaded = router.getStateForAction(stack, CommonActions.preload('details'), options)!;
  expect(preloaded.browserHistory).toBeUndefined();
  const first = router.getStateForAction(preloaded.state, StackActions.push('details'), options)!;
  const second = router.getStateForAction(first.state, StackActions.push('final'), options)!;
  expect(first.browserHistory).toEqual({ type: 'push' });
  expect(second.browserHistory).toEqual({ type: 'push' });
  expect(
    router.getStateForAction(second.state, StackActions.popToTop(), options)?.browserHistory
  ).toMatchObject({ type: 'pop', count: 2 });
  expect(
    router.getStateForAction(second.state, CommonActions.goBack(), options)?.browserHistory
  ).toMatchObject({ type: 'pop', count: 1 });
  expect(
    router.getStateForAction(second.state, StackActions.replace('details'), options)?.browserHistory
  ).toBeUndefined();
  expect(
    router.getStateForAction(second.state, CommonActions.setParams({ filter: 'recent' }), options)
      ?.browserHistory
  ).toBeUndefined();
  expect(router.getStateForAction(stack, CommonActions.goBack(), options)).toBeNull();
});

test('tabs with full history push each visit and pop one visit on back', () => {
  const router = TabRouter({ backBehavior: 'fullHistory' });
  const state = { ...stack, type: 'tab' } as const;
  const first = router.getStateForAction(state, CommonActions.navigate('details'), options)!;
  const second = router.getStateForAction(first.state, CommonActions.navigate('index'), options)!;
  expect(first.browserHistory).toEqual({ type: 'push' });
  expect(second.browserHistory).toEqual({ type: 'push' });
  expect(
    router.getStateForAction(second.state, CommonActions.goBack(), options)?.browserHistory
  ).toMatchObject({ type: 'pop', count: 1 });
  expect(
    router.getStateForAction(second.state, CommonActions.preload('final'), options)?.browserHistory
  ).toBeUndefined();
});

test('drawer open and back share a browser history entry even at the same URL', () => {
  const router = DrawerRouter({});
  const state = { ...stack, type: 'drawer' } as const;
  const opened = router.getStateForAction(state, DrawerActions.openDrawer(), options)!;
  expect(opened.browserHistory).toEqual({ type: 'push' });
  expect(
    router.getStateForAction(opened.state, CommonActions.goBack(), options)?.browserHistory
  ).toMatchObject({ type: 'pop', count: 1 });
  expect(
    router.getStateForAction(opened.state, DrawerActions.closeDrawer(), options)?.browserHistory
  ).toMatchObject({ type: 'pop', count: 1 });
});

test('promoting a singular stack route pushes even when the active route count is unchanged', () => {
  const router = StackRouter({});
  const state = {
    ...stack,
    index: 2,
    routes: options.routeNames.map((name) => ({ key: name, name })),
  };
  const result = router.getStateForAction(state, StackActions.push('index'), {
    ...options,
    routeGetIdList: { index: () => 'singular' },
  })!;
  expect(result.state.routes.map((route) => route.name)).toEqual(['details', 'final', 'index']);
  expect(result.browserHistory).toEqual({ type: 'push' });
});

test('deduplicated tab history treats returning to an earlier tab as a forward visit', () => {
  const router = TabRouter({ backBehavior: 'history' });
  const state = { ...stack, type: 'tab' as const };
  const first = router.getStateForAction(state, CommonActions.navigate('details'), options)!;
  const second = router.getStateForAction(first.state, CommonActions.navigate('final'), options)!;
  const returned = router.getStateForAction(
    second.state,
    CommonActions.navigate('index'),
    options
  )!;
  expect(returned.state.history).toHaveLength(3);
  expect(returned.browserHistory).toEqual({ type: 'push' });
  const back = router.getStateForAction(returned.state, CommonActions.goBack(), options)!;
  expect(back.state.routes[back.state.index]!.name).toBe('final');
  expect(back.browserHistory).toMatchObject({ type: 'pop', count: 1 });
});

test('replaces an open drawer entry when child navigation closes the drawer', () => {
  const router = DrawerRouter({});
  const opened = router.getStateForAction(
    { ...stack, type: 'drawer' },
    DrawerActions.openDrawer(),
    options
  )!.state;
  const focused = router.getStateForRouteFocus(opened, 'index');
  expect(router.getBrowserHistoryForRouteFocus?.(opened, focused, { type: 'push' })).toEqual({
    type: 'replace',
  });
});
