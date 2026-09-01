import { describe, expect, test } from '@jest/globals';

import {
  CommonActions,
  DrawerActions,
  type DrawerNavigationState,
  DrawerRouter,
  type ParamListBase,
  type RouterConfigOptions,
  TabActions,
} from '../index';

const options: RouterConfigOptions = {
  routeNames: ['one', 'two', 'three'],
  routeGetIdList: {},
};

const state = (
  names: string[] = ['one'],
  index = 0,
  extra: Partial<DrawerNavigationState<ParamListBase>> = {}
): DrawerNavigationState<ParamListBase> => ({
  stale: false,
  type: 'drawer',
  key: 'drawer',
  routeKeySeq: 0,
  routeNames: options.routeNames,
  routes: names.map((name) => ({ name, key: `${name}-key` })),
  index,
  ...extra,
});

describe('drawer status', () => {
  test('open, close and toggle use drawerStatus instead of history', () => {
    const router = DrawerRouter({});
    let next = router.getStateForAction(state(), DrawerActions.openDrawer(), options)!.state;
    expect(next.drawerStatus).toBe('open');
    expect(next.history).toBeUndefined();

    next = router.getStateForAction(next, DrawerActions.toggleDrawer(), options)!.state;
    expect(next.drawerStatus).toBeUndefined();
    next = router.getStateForAction(next, DrawerActions.closeDrawer(), options)!.state;
    expect(next.drawerStatus).toBeUndefined();
  });

  test('absent status means the configured open default', () => {
    const router = DrawerRouter({ defaultStatus: 'open' });
    const closed = router.getStateForAction(state(), DrawerActions.closeDrawer(), options)!.state;
    expect(closed.drawerStatus).toBe('closed');
    const open = router.getStateForAction(closed, DrawerActions.openDrawer(), options)!.state;
    expect(open.drawerStatus).toBeUndefined();
  });

  test('navigation to another route resets status to default', () => {
    const router = DrawerRouter({ backBehavior: 'history' });
    const next = router.getStateForAction(
      state(['one', 'two'], 0, { drawerStatus: 'open' }),
      TabActions.jumpTo('two'),
      options
    )!.state;
    expect(next.drawerStatus).toBeUndefined();
    expect(next.routes[next.index]?.name).toBe('two');
  });

  test('navigation to the focused route preserves status', () => {
    const router = DrawerRouter({ backBehavior: 'history' });
    const next = router.getStateForAction(
      state(['one'], 0, { drawerStatus: 'open' }),
      CommonActions.setParams({ value: 1 }),
      options
    )!.state;
    expect(next.drawerStatus).toBe('open');
  });

  test('route focus closes the drawer', () => {
    const router = DrawerRouter({ backBehavior: 'history' });
    const current = state(['one', 'two'], 0, { drawerStatus: 'open' });
    expect(router.getStateForRouteFocus(current, 'one-key').drawerStatus).toBeUndefined();
    expect(router.getStateForRouteFocus(current, 'two-key').drawerStatus).toBeUndefined();
  });
});

describe('back behavior', () => {
  test.each(['firstRoute', 'initialRoute', 'order', 'history', 'fullHistory', 'none'] as const)(
    'closes the drawer before delegating with %s',
    (backBehavior) => {
      const router = DrawerRouter({ backBehavior, initialRouteName: 'one' });
      const current = state(['one', 'two'], 1, {
        drawerStatus: 'open',
        ...(backBehavior === 'fullHistory'
          ? {
              history: [
                { type: 'route' as const, key: 'one-key' },
                { type: 'route' as const, key: 'two-key' },
              ],
            }
          : undefined),
      });
      const closed = router.getStateForAction(current, CommonActions.goBack(), options)!.state;
      expect(closed.drawerStatus).toBeUndefined();
      expect(closed.index).toBe(1);

      const backed = router.getStateForAction(closed, CommonActions.goBack(), options);
      if (backBehavior === 'none') {
        expect(backed).toBeNull();
      } else {
        expect(backed?.state.index).toBe(0);
      }
    }
  );
});

describe('history migration', () => {
  test('strips legacy drawer entries and keeps route entries in fullHistory', () => {
    const legacy = state(['one'], 0, {
      history: [
        { type: 'route', key: 'one-key' },
        // Persisted states may still contain the old drawer entry shape.
        { type: 'drawer', status: 'open' } as never,
      ],
    });
    const next = DrawerRouter({ backBehavior: 'fullHistory' }).getStateForAction(
      legacy,
      CommonActions.setParams({ value: 1 }),
      options
    )!.state;
    expect(next.history).toEqual([{ type: 'route', key: 'one-key', params: { value: 1 } }]);
  });

  test('strips all history outside fullHistory', () => {
    const next = DrawerRouter({ backBehavior: 'history' }).getStateForAction(
      state(['one'], 0, { history: [{ type: 'route', key: 'one-key' }] }),
      DrawerActions.openDrawer(),
      options
    )!.state;
    expect(next.history).toBeUndefined();
    expect(next.drawerStatus).toBe('open');
  });

  test('preserves drawerStatus during route-name reconciliation and preload', () => {
    const router = DrawerRouter({ backBehavior: 'history' });
    let next = router.getStateForAction(
      state(['one'], 0, { drawerStatus: 'open' }),
      { type: 'ROUTE_NAMES_CHANGED', payload: { routeNames: ['one', 'two'] } },
      { ...options, routeNames: ['one', 'two'] }
    )!.state;
    next = router.getStateForAction(next, CommonActions.preload('two'), options)!.state;
    expect(next.drawerStatus).toBe('open');
  });
});
