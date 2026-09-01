import { describe, expect, jest, test } from '@jest/globals';

import {
  CommonActions,
  type ParamListBase,
  type RouterConfigOptions,
  TabActions,
  type TabNavigationState,
  TabRouter,
} from '../index';

const options: RouterConfigOptions = {
  routeNames: ['one', 'two', 'three', 'four'],
  routeGetIdList: {},
};

const state = (
  names: string[] = ['one'],
  index = 0,
  extra: Partial<TabNavigationState<ParamListBase>> = {}
): TabNavigationState<ParamListBase> => ({
  stale: false,
  type: 'tab',
  key: 'tabs',
  routeKeySeq: 0,
  routeNames: options.routeNames,
  routes: names.map((name) => ({ name, key: `${name}-key` })),
  index,
  ...extra,
});

const names = (value: TabNavigationState<ParamListBase>) => value.routes.map((route) => route.name);

describe('route storage by back behavior', () => {
  test('none keeps insertion order and never handles back', () => {
    const router = TabRouter({ backBehavior: 'none' });
    let next = router.getStateForAction(state(), TabActions.jumpTo('three'), options)!.state;
    next = router.getStateForAction(next, TabActions.jumpTo('two'), options)!.state;

    expect(names(next)).toEqual(['one', 'three', 'two']);
    expect(next.index).toBe(2);
    expect(next.history).toBeUndefined();
    expect(router.getStateForAction(next, CommonActions.goBack(), options)).toBeNull();
  });

  test('history stores the deduped visit stack in the route prefix', () => {
    const router = TabRouter({ backBehavior: 'history' });
    let next = router.getStateForAction(state(), TabActions.jumpTo('three'), options)!.state;
    next = router.getStateForAction(next, TabActions.jumpTo('two'), options)!.state;

    expect(names(next)).toEqual(['one', 'three', 'two']);
    expect(next.index).toBe(2);
    next = router.getStateForAction(next, CommonActions.goBack(), options)!.state;
    expect(next.index).toBe(1);
    expect(next.routes[next.index]?.name).toBe('three');

    next = router.getStateForAction(next, TabActions.jumpTo('four'), options)!.state;
    expect(names(next)).toEqual(['one', 'three', 'four', 'two']);
    expect(next.index).toBe(2);
    expect(next.history).toBeUndefined();
  });

  test('history focuses an existing visited route without duplicates', () => {
    const router = TabRouter({ backBehavior: 'history' });
    const next = router.getStateForAction(
      state(['one', 'three', 'two'], 2),
      TabActions.jumpTo('one'),
      options
    )!.state;

    expect(names(next)).toEqual(['three', 'two', 'one']);
    expect(next.index).toBe(2);
  });

  test('order keeps declared order and decrements index on back', () => {
    const router = TabRouter({ backBehavior: 'order' });
    let next = router.getStateForAction(
      state(['one', 'two', 'three', 'four']),
      TabActions.jumpTo('three'),
      options
    )!.state;

    expect(names(next)).toEqual(options.routeNames);
    expect(next.index).toBe(2);
    next = router.getStateForAction(next, CommonActions.goBack(), options)!.state;
    expect(next.index).toBe(1);
    expect(next.routes[next.index]?.name).toBe('two');
  });

  test.each([
    ['firstRoute', undefined, 'one'],
    ['initialRoute', 'two', 'two'],
  ] satisfies ['firstRoute' | 'initialRoute', string | undefined, string][])(
    '%s keeps its anchor at route zero',
    (backBehavior, initialRouteName, anchor) => {
      const router = TabRouter({ backBehavior, initialRouteName });
      let next = router.getStateForAction(state(), TabActions.jumpTo('three'), options)!.state;

      expect(names(next).slice(0, 2)).toEqual([anchor, 'three']);
      expect(next.index).toBe(1);
      next = router.getStateForAction(next, CommonActions.goBack(), options)!.state;
      expect(next.index).toBe(0);
      expect(next.routes[0]?.name).toBe(anchor);
      expect(router.getStateForAction(next, CommonActions.goBack(), options)).toBeNull();
    }
  );

  test('anchor back creates a missing anchor for a seeded deep link', () => {
    const router = TabRouter({ backBehavior: 'initialRoute', initialRouteName: 'two' });
    const next = router.getStateForAction(
      state(['three'], 0),
      CommonActions.goBack(),
      options
    )!.state;

    expect(names(next)).toEqual(['two', 'three']);
    expect(next.index).toBe(0);
  });
});

describe('full history', () => {
  test('keeps duplicate visits and restores parameter snapshots', () => {
    const router = TabRouter({ backBehavior: 'fullHistory' });
    let next = router.getStateForAction(
      state(['one', 'two'], 0),
      CommonActions.navigate('two', { value: 1 }),
      options
    )!.state;
    next = router.getStateForAction(
      next,
      CommonActions.navigate('one', { value: 2 }),
      options
    )!.state;

    expect(next.history?.map((entry) => entry.key)).toEqual(['one-key', 'two-key', 'one-key']);
    next = router.getStateForAction(next, CommonActions.goBack(), options)!.state;
    expect(next.routes[next.index]?.name).toBe('two');
    expect(next.routes[next.index]?.params).toEqual({ value: 1 });
  });

  test('reconstructs missing history from the focused route', () => {
    const next = TabRouter({ backBehavior: 'fullHistory' }).getStateForRouteFocus(
      state(['one', 'two'], 0),
      'two-key'
    );
    expect(next.history?.map((entry) => entry.key)).toEqual(['one-key', 'two-key']);
  });
});

describe('route name reconciliation', () => {
  test('ROUTE_NAMES_CHANGED ignores an order-only update', () => {
    const current = state(['one', 'two'], 1, { history: [{ type: 'route', key: 'two-key' }] });
    const next = TabRouter({ backBehavior: 'history' }).getStateForAction(
      current,
      { type: 'ROUTE_NAMES_CHANGED', payload: { routeNames: ['four', 'three', 'two', 'one'] } },
      { ...options, routeNames: ['four', 'three', 'two', 'one'] }
    )!.state;

    expect(next.routeNames).toEqual(options.routeNames);
    expect(next.history).toBeUndefined();
  });

  test('ROUTE_NAMES_CHANGED filters removed routes and preserves surviving focus', () => {
    const next = TabRouter({ backBehavior: 'history' }).getStateForAction(
      state(['one', 'two', 'three'], 1),
      { type: 'ROUTE_NAMES_CHANGED', payload: { routeNames: ['two', 'four'] } },
      { ...options, routeNames: ['two', 'four'] }
    )!.state;

    expect(next.routeNames).toEqual(['two', 'four']);
    expect(names(next)).toEqual(['two']);
    expect(next.index).toBe(0);
  });

  test('ROUTE_NAMES_CHANGED creates a fallback when no route survives', () => {
    const next = TabRouter({}).getStateForAction(
      state(['one']),
      { type: 'ROUTE_NAMES_CHANGED', payload: { routeNames: ['four'] } },
      { ...options, routeNames: ['four'] }
    )!.state;
    expect(names(next)).toEqual(['four']);
    expect(next.index).toBe(0);
  });

  test('ROUTE_NAMES_ORDER_CHANGED validates the set and remaps focus', () => {
    const router = TabRouter({ backBehavior: 'order' });
    const current = state(['one', 'two', 'three', 'four'], 1);
    expect(
      router.getStateForAction(
        current,
        { type: 'ROUTE_NAMES_ORDER_CHANGED', payload: { routeNames: ['one', 'two'] } },
        options
      )
    ).toBeNull();

    const next = router.getStateForAction(
      current,
      {
        type: 'ROUTE_NAMES_ORDER_CHANGED',
        payload: { routeNames: ['four', 'three', 'two', 'one'] },
      },
      options
    )!.state;
    expect(names(next)).toEqual(['four', 'three', 'two', 'one']);
    expect(next.index).toBe(2);
    expect(next.routes[next.index]?.name).toBe('two');
  });
});

describe('preload and replace', () => {
  test('PRELOAD uses declared membership and appends outside order mode', () => {
    const next = TabRouter({ backBehavior: 'history' }).getStateForAction(
      state(['one'], 0, { routeNames: ['one'] }),
      CommonActions.preload('three'),
      options
    )!.state;
    expect(names(next)).toEqual(['one', 'three']);
    expect(next.index).toBe(0);
  });

  test('order PRELOAD inserts at the declared position and preserves focus', () => {
    const next = TabRouter({ backBehavior: 'order' }).getStateForAction(
      state(['one', 'three'], 1),
      CommonActions.preload('two'),
      options
    )!.state;
    expect(names(next)).toEqual(['one', 'two', 'three']);
    expect(next.index).toBe(2);
  });

  test('fullHistory PRELOAD re-keys history when getId changes', () => {
    const routerOptions: RouterConfigOptions = {
      ...options,
      routeGetIdList: { one: ({ params }) => params?.id as string | undefined },
    };
    const next = TabRouter({ backBehavior: 'fullHistory' }).getStateForAction(
      state(['one'], 0, {
        routes: [{ name: 'one', key: 'old', params: { id: 'old' } }],
        history: [{ type: 'route', key: 'old', params: { id: 'old' } }],
      }),
      CommonActions.preload('one', { id: 'new' }),
      routerOptions
    )!.state;
    expect(next.routes[0]?.key).not.toBe('old');
    expect(next.history?.[0]?.key).toBe(next.routes[0]?.key);
  });

  test('history REPLACE moves the replaced route to the forward region', () => {
    const next = TabRouter({ backBehavior: 'history' }).getStateForAction(
      state(['one', 'two', 'three'], 2),
      TabActions.replace('two'),
      options
    )!.state;
    expect(names(next)).toEqual(['one', 'two', 'three']);
    expect(next.index).toBe(1);
    expect(next.history).toBeUndefined();
  });

  test('replacing a focused anchor leaves no back target', () => {
    const router = TabRouter({ backBehavior: 'firstRoute' });
    const next = router.getStateForAction(
      state(['one', 'two'], 0),
      TabActions.replace('two'),
      options
    )!.state;
    expect(names(next)).toEqual(['two', 'one']);
    expect(next.index).toBe(0);
    expect(router.getStateForAction(next, CommonActions.goBack(), options)).toBeNull();
  });
});

describe('state migration', () => {
  test.each(['firstRoute', 'initialRoute', 'order', 'history', 'none'] as const)(
    '%s strips legacy history on the first handled action',
    (backBehavior) => {
      const next = TabRouter({ backBehavior }).getStateForAction(
        state(['one', 'two'], 0, { history: [{ type: 'route', key: 'one-key' }] }),
        CommonActions.setParams({ value: 1 }),
        options
      )!.state;
      expect(next.history).toBeUndefined();
    }
  );

  test('keeps an empty state at index -1', () => {
    const empty = state([], -1);
    expect(TabRouter({ backBehavior: 'history' }).getStateForRouteFocus(empty, 'missing')).toEqual(
      empty
    );
  });

  test('warns and ignores partial RESET', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    expect(
      TabRouter({}).getStateForAction(
        state(),
        CommonActions.reset({ routes: [{ name: 'one' }] }),
        options
      )
    ).toBeNull();
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });
});
