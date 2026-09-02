import { describe, expect, jest, test } from '@jest/globals';
import { expectTypeOf } from 'expect-type';

import {
  CommonActions,
  type ParamListBase,
  type RouterConfigOptions,
  TabActions,
  type TabActionHelpers,
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
  key: 'navigator:tab',
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
    const router = TabRouter({
      backBehavior: 'initialRoute',
      initialRouteName: 'two',
    });
    const next = router.getStateForAction(
      state(['three'], 0),
      CommonActions.goBack(),
      options
    )!.state;

    expect(next.routes).toEqual([
      { key: 'two:tab-0', name: 'two' },
      { key: 'three-key', name: 'three' },
    ]);
    expect(next.index).toBe(0);
    expect(next.routeKeySeq).toBe(1);
  });

  test.each([
    ['firstRoute', undefined, 'one'],
    ['initialRoute', 'two', 'two'],
  ] satisfies ['firstRoute' | 'initialRoute', string | undefined, string][])(
    '%s preloads its anchor before a seeded deep link',
    (backBehavior, initialRouteName, anchor) => {
      const router = TabRouter({ backBehavior, initialRouteName });
      let next = router.getStateForAction(
        state(['three', anchor === 'one' ? 'two' : 'one'], 0),
        CommonActions.preload(anchor),
        options
      )!.state;

      expect(names(next)).toEqual([anchor, 'three', anchor === 'one' ? 'two' : 'one']);
      expect(next.routes[0]?.key).toBe(`${anchor}:tab-0`);
      expect(next.index).toBe(1);

      next = router.getStateForAction(next, CommonActions.goBack(), options)!.state;

      expect(names(next)).toEqual([anchor, 'three', anchor === 'one' ? 'two' : 'one']);
      expect(next.index).toBe(0);
    }
  );
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
    const next = TabRouter({
      backBehavior: 'fullHistory',
    }).getStateForRouteFocus(state(['one', 'two'], 0), 'two-key');
    expect(next.history?.map((entry) => entry.key)).toEqual(['one-key', 'two-key']);
  });

  test('keeps visit history aligned when the focused route is removed', () => {
    const router = TabRouter({ backBehavior: 'fullHistory' });
    const reconciled = router.getStateForAction(
      state(['one', 'two', 'three'], 2, {
        history: [
          { type: 'route', key: 'one-key' },
          { type: 'route', key: 'two-key' },
          { type: 'route', key: 'three-key' },
        ],
      }),
      { type: 'ROUTE_NAMES_CHANGED', payload: { routeNames: ['one', 'two'] } },
      { ...options, routeNames: ['one', 'two'] }
    )!.state;

    expect(reconciled.history?.at(-1)?.key).toBe('one-key');

    const next = router.getStateForAction(reconciled, CommonActions.goBack(), {
      ...options,
      routeNames: ['one', 'two'],
    })!.state;
    expect(next.routes[next.index]?.name).toBe('two');
  });
});

describe('route name reconciliation', () => {
  test('ROUTE_NAMES_CHANGED ignores an order-only update', () => {
    const current = state(['one', 'two'], 1);
    const next = TabRouter({ backBehavior: 'history' }).getStateForAction(
      current,
      {
        type: 'ROUTE_NAMES_CHANGED',
        payload: { routeNames: ['four', 'three', 'two', 'one'] },
      },
      { ...options, routeNames: ['four', 'three', 'two', 'one'] }
    )!.state;

    expect(next).toBe(current);
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
    expect(next.routes).toEqual([{ key: 'four:tab-0', name: 'four' }]);
    expect(next.index).toBe(0);
    expect(next.routeKeySeq).toBe(1);
  });

  test('GO_BACK uses the route names stored in state for its anchor', () => {
    const next = TabRouter({ backBehavior: 'firstRoute' }).getStateForAction(
      state(['two'], 0, { routeNames: ['one', 'two'] }),
      CommonActions.goBack(),
      { ...options, routeNames: ['two', 'one'] }
    )!.state;

    expect(names(next)).toEqual(['one', 'two']);
    expect(next.index).toBe(0);
  });

  test('ROUTE_NAMES_ORDER_CHANGED validates the set and remaps focus', () => {
    const router = TabRouter({ backBehavior: 'order' });
    const current = state(['one', 'two', 'three', 'four'], 1);
    expect(
      router.getStateForAction(
        current,
        {
          type: 'ROUTE_NAMES_ORDER_CHANGED',
          payload: { routeNames: ['one', 'two'] },
        },
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
    expect(next.routes).toEqual([
      { key: 'one-key', name: 'one' },
      { key: 'three:tab-0', name: 'three' },
    ]);
    expect(next.index).toBe(0);
  });

  test('order PRELOAD inserts at the declared position and preserves focus', () => {
    const next = TabRouter({ backBehavior: 'order' }).getStateForAction(
      state(['one', 'three'], 1),
      CommonActions.preload('two'),
      options
    )!.state;
    expect(next.routes).toEqual([
      { key: 'one-key', name: 'one' },
      { key: 'two:tab-0', name: 'two' },
      { key: 'three-key', name: 'three' },
    ]);
    expect(next.index).toBe(2);
  });

  test('PRELOAD keeps a matching getId key and re-keys a changed ID', () => {
    const router = TabRouter({ backBehavior: 'history' });
    const routerOptions: RouterConfigOptions = {
      ...options,
      routeGetIdList: { two: ({ params }) => params?.id as string | undefined },
    };
    const current = state(['one', 'two'], 0, {
      routes: [
        { key: 'one-key', name: 'one' },
        { key: 'two-key', name: 'two', params: { id: 'old', removed: true } },
      ],
    });

    const matching = router.getStateForAction(
      current,
      CommonActions.preload('two', { id: 'old' }),
      routerOptions
    )!.state;
    expect(matching.routes[1]).toEqual({ key: 'two-key', name: 'two', params: { id: 'old' } });
    expect(matching.index).toBe(0);
    expect(matching.routeKeySeq).toBe(0);

    const changed = router.getStateForAction(
      current,
      CommonActions.preload('two', { id: 'new' }),
      routerOptions
    )!.state;
    expect(changed.routes[1]).toEqual({
      key: 'two:tab-0',
      name: 'two',
      params: { id: 'new' },
    });
    expect(changed.index).toBe(0);
    expect(changed.routeKeySeq).toBe(1);
    expect(changed.history).toBeUndefined();
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
    expect(next.routes[0]?.key).toBe('one:tab-0');
    expect(next.history?.[0]?.key).toBe('one:tab-0');
  });

  test('history REPLACE moves the replaced route to the forward region', () => {
    const next = TabRouter({ backBehavior: 'history' }).getStateForAction(
      state(['one', 'two', 'three', 'four'], 1),
      TabActions.replace('four'),
      options
    )!.state;
    expect(names(next)).toEqual(['one', 'four', 'two', 'three']);
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
        state(['one', 'two'], 0, {
          history: [{ type: 'route', key: 'one-key' }],
        }),
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

describe('router contract', () => {
  test('types replace action helper params', () => {
    type Params = {
      optional: undefined;
      required: { id: string };
    };

    expectTypeOf<TabActionHelpers<Params>['replace']>().toBeCallableWith('optional');
    expectTypeOf<TabActionHelpers<Params>['replace']>().toBeCallableWith('required', { id: '1' });
    // @ts-expect-error: Required route params cannot be omitted.
    expectTypeOf<TabActionHelpers<Params>['replace']>().toBeCallableWith('required');
    // @ts-expect-error: Route params must match the route's param type.
    expectTypeOf<TabActionHelpers<Params>['replace']>().toBeCallableWith('required', { id: 1 });
    // @ts-expect-error: The route must exist in the param list.
    expectTypeOf<TabActionHelpers<Params>['replace']>().toBeCallableWith('missing');
  });

  test('handled actions and route focus normalize tab metadata', () => {
    const router = TabRouter({});
    const legacy = state(['one', 'two'], 0, {
      type: undefined,
      history: [{ type: 'route', key: 'one-key' }],
    });

    const handled = router.getStateForAction(legacy, TabActions.jumpTo('two'), options)!.state;
    expect(handled.type).toBe('tab');
    expect(handled.history).toBeUndefined();

    const focused = router.getStateForRouteFocus(legacy, 'two-key');
    expect(focused.type).toBe('tab');
    expect(focused.history).toBeUndefined();
  });

  test('complete RESET state gets tab type and strips legacy history', () => {
    const current = state(['one', 'two'], 1);
    const next = TabRouter({}).getStateForAction(
      current,
      CommonActions.reset({
        ...current,
        type: undefined,
        index: 0,
        routes: [current.routes[0]!],
        history: [{ type: 'route', key: 'one-key' }],
      }),
      options
    )!.state;

    expect(next).toMatchObject({ type: 'tab', index: 0, routes: [current.routes[0]!] });
    expect(next.history).toBeUndefined();
  });

  test('preserves drawer type when used by DrawerRouter', () => {
    const drawerState = { ...state(['one', 'two']), type: 'drawer' as const };
    // DrawerRouter delegates with a structurally compatible drawer state.
    const next = TabRouter({}).getStateForAction(
      drawerState as unknown as TabNavigationState<ParamListBase>,
      TabActions.jumpTo('two'),
      options
    )!.state;

    expect(next.type).toBe('drawer');
  });

  test.each([
    [CommonActions.navigate('two'), 'two-key'],
    [CommonActions.navigate('two', { id: 'new' }), 'two:tab-0'],
    [CommonActions.preload('two'), 'two-key'],
  ])('returns the affected route key for $type', (action, affectedRouteKey) => {
    const routeGetIdList: RouterConfigOptions['routeGetIdList'] =
      action.type === 'NAVIGATE' && action.payload.params
        ? {
            two: ({ params }) =>
              params && 'id' in params && typeof params.id === 'string' ? params.id : undefined,
          }
        : {};
    const current = state(['one', 'two'], 0, {
      routes: [
        { key: 'one-key', name: 'one' },
        { key: 'two-key', name: 'two', params: { id: 'old' } },
      ],
    });
    const result = TabRouter({}).getStateForAction(current, action, {
      ...options,
      routeGetIdList,
    });

    expect(result?.affectedRouteKey).toBe(affectedRouteKey);
  });

  test('returns the back destination key', () => {
    const result = TabRouter({ backBehavior: 'history' }).getStateForAction(
      state(['one', 'two'], 1),
      CommonActions.goBack(),
      options
    );

    expect(result?.affectedRouteKey).toBe('one-key');
  });
});

describe('route creation and child state', () => {
  test.each([
    [CommonActions.navigate('two', { value: 2 }), ['one', 'two']],
    [TabActions.jumpTo('two', { value: 2 }), ['one', 'two']],
    [TabActions.replace('two', { value: 2 }), ['two', 'one']],
  ])('$0.type mints and focuses an absent declared route', (action, expectedNames) => {
    const next = TabRouter({ backBehavior: 'history' }).getStateForAction(
      state(['one']),
      action,
      options
    )!.state;

    expect(names(next)).toEqual(expectedNames);
    expect(next.routes[next.index]).toEqual({
      key: 'two:tab-0',
      name: 'two',
      params: { value: 2 },
    });
  });

  test('actions do not mint undeclared routes', () => {
    const current = state(['one']);
    const router = TabRouter({});
    const declared = { ...options, routeNames: ['one'] };

    expect(router.getStateForAction(current, CommonActions.navigate('two'), declared)).toBeNull();
    expect(router.getStateForAction(current, TabActions.jumpTo('two'), declared)).toBeNull();
    expect(router.getStateForAction(current, CommonActions.preload('two'), declared)).toBeNull();
  });

  test.each(['JUMP_TO', 'PRELOAD'] as const)(
    '%s attaches trusted child state to an existing route',
    (type) => {
      const childState = {
        routes: [{ name: 'child' }],
        __internal__routerActionState: true as const,
      };
      const next = TabRouter({}).getStateForAction(
        state(['one', 'two']),
        { type, payload: { name: 'two', state: childState } },
        options
      )!.state;

      expect(next.routes[1]?.state).toEqual({ routes: [{ name: 'child' }] });
    }
  );

  test('PRELOAD attaches trusted child state to an absent route without changing focus', () => {
    const childState = {
      routes: [{ name: 'child' }],
      __internal__routerActionState: true as const,
    };
    const result = TabRouter({}).getStateForAction(
      state(['one']),
      { type: 'PRELOAD', payload: { name: 'two', state: childState } },
      options
    )!;

    expect(result.state.index).toBe(0);
    expect(result.state.routes[1]).toEqual({
      key: 'two:tab-0',
      name: 'two',
      state: { routes: [{ name: 'child' }] },
    });
    expect(result.affectedRouteKey).toBe('two:tab-0');
  });
});

describe('navigation updates', () => {
  test('navigate replaces params unless merge is true', () => {
    const router = TabRouter({});
    const current = state(['one', 'two'], 1, {
      routes: [
        { key: 'one-key', name: 'one' },
        { key: 'two-key', name: 'two', params: { answer: 42 } },
      ],
    });

    const replaced = router.getStateForAction(
      current,
      CommonActions.navigate('two', { fruit: 'orange' }),
      options
    )!.state;
    expect(replaced.routes[1]?.params).toEqual({ fruit: 'orange' });

    const merged = router.getStateForAction(
      current,
      CommonActions.navigate({ name: 'two', params: { fruit: 'orange' }, merge: true }),
      options
    )!.state;
    expect(merged.routes[1]?.params).toEqual({ answer: 42, fruit: 'orange' });
  });

  test('jumpTo replaces params instead of merging them', () => {
    const next = TabRouter({}).getStateForAction(
      state(['one', 'two'], 1, {
        routes: [
          { key: 'one-key', name: 'one' },
          { key: 'two-key', name: 'two', params: { answer: 42 } },
        ],
      }),
      TabActions.jumpTo('two', { fruit: 'orange' }),
      options
    )!.state;

    expect(next.routes[1]?.params).toEqual({ fruit: 'orange' });
  });

  test('navigate adds, updates, and preserves paths', () => {
    const router = TabRouter({});
    let next = router.getStateForAction(
      state(['one', 'two'], 1),
      CommonActions.navigate({ name: 'two', path: '/first' }),
      options
    )!.state;
    expect(next.routes[1]?.path).toBe('/first');

    next = router.getStateForAction(
      next,
      CommonActions.navigate({ name: 'two', path: '/second' }),
      options
    )!.state;
    expect(next.routes[1]?.path).toBe('/second');

    next = router.getStateForAction(next, CommonActions.navigate('two'), options)!.state;
    expect(next.routes[1]?.path).toBe('/second');
  });

  test.each([
    CommonActions.navigate('two', { id: 'new' }),
    TabActions.jumpTo('two', { id: 'new' }),
  ])('$type re-keys with getId using the exact minted key', (action) => {
    const next = TabRouter({}).getStateForAction(
      state(['one', 'two'], 0, {
        routes: [
          { key: 'one-key', name: 'one' },
          { key: 'two-old', name: 'two', params: { id: 'old' } },
        ],
      }),
      action,
      {
        ...options,
        routeGetIdList: { two: ({ params }) => params?.id as string | undefined },
      }
    )!.state;

    expect(next.routes[next.index]?.key).toBe('two:tab-0');
    expect(next.routeKeySeq).toBe(1);
  });

  test('navigation re-keys a preloaded route with the next exact minted key', () => {
    const router = TabRouter({});
    const routerOptions: RouterConfigOptions = {
      ...options,
      routeGetIdList: { two: ({ params }) => params?.id as string | undefined },
    };
    const preloaded = router.getStateForAction(
      state(['one']),
      CommonActions.preload('two', { id: 'one' }),
      routerOptions
    )!.state;
    const next = router.getStateForAction(
      preloaded,
      CommonActions.navigate('two', { id: 'two' }),
      routerOptions
    )!.state;

    expect(next.routes[next.index]?.key).toBe('two:tab-1');
    expect(next.routeKeySeq).toBe(2);
  });
});

describe('replace behavior', () => {
  test('history replaces from visit order rather than declared order', () => {
    const router = TabRouter({ backBehavior: 'history' });
    let next = router.getStateForAction(state(['one']), TabActions.jumpTo('four'), options)!.state;
    next = router.getStateForAction(next, TabActions.jumpTo('two'), options)!.state;
    next = router.getStateForAction(next, TabActions.replace('three'), options)!.state;

    expect(names(next)).toEqual(['one', 'four', 'three', 'two']);
    expect(next.routes.map((route) => route.key)).toEqual([
      'one-key',
      'four:tab-0',
      'three:tab-2',
      'two:tab-1',
    ]);
    expect(next.index).toBe(2);
  });

  test('fullHistory removes only the latest replaced visit', () => {
    const next = TabRouter({ backBehavior: 'fullHistory' }).getStateForAction(
      state(['one', 'two', 'three'], 0, {
        history: [
          { type: 'route', key: 'one-key' },
          { type: 'route', key: 'two-key' },
          { type: 'route', key: 'one-key' },
        ],
      }),
      TabActions.replace('three'),
      options
    )!.state;

    expect(next.history).toEqual([
      { type: 'route', key: 'one-key' },
      { type: 'route', key: 'two-key' },
      { type: 'route', key: 'three-key' },
    ]);
  });

  test.each([
    ['firstRoute', undefined, ['three', 'one', 'two']],
    ['initialRoute', 'two', ['three', 'two', 'one']],
    ['none', undefined, ['one', 'two', 'three']],
    ['order', undefined, ['one', 'two', 'three']],
  ] satisfies ['firstRoute' | 'initialRoute' | 'none' | 'order', string | undefined, string[]][])(
    '%s keeps its route-array replacement semantics',
    (backBehavior, initialRouteName, expectedNames) => {
      const next = TabRouter({ backBehavior, initialRouteName }).getStateForAction(
        state(['one', 'two', 'three'], backBehavior === 'initialRoute' ? 1 : 0),
        TabActions.replace('three'),
        options
      )!.state;

      expect(names(next)).toEqual(expectedNames);
      expect(next.routes[next.index]?.name).toBe('three');
    }
  );

  test('replacing a route with itself preserves route order and the navigator key', () => {
    const current = state(['one', 'two', 'three'], 1);
    const next = TabRouter({ backBehavior: 'history' }).getStateForAction(
      current,
      TabActions.replace('two'),
      options
    )!.state;

    expect(next.key).toBe(current.key);
    expect(names(next)).toEqual(['one', 'two', 'three']);
    expect(next.index).toBe(1);
  });

  test('preserves the navigator key across repeated replaces', () => {
    const router = TabRouter({ backBehavior: 'history' });
    const current = state(['one'], 0);
    const replaced = router.getStateForAction(current, TabActions.replace('two'), options)!.state;
    const replacedAgain = router.getStateForAction(
      replaced,
      TabActions.replace('three'),
      options
    )!.state;

    expect(replaced.key).toBe(current.key);
    expect(replacedAgain.key).toBe(current.key);
  });
});

describe('fullHistory details', () => {
  test('keeps duplicate visits and params through focus changes', () => {
    const router = TabRouter({ backBehavior: 'fullHistory' });
    let next = state(['one', 'two', 'three'], 0, {
      routes: [
        { key: 'one-key', name: 'one' },
        { key: 'two-key', name: 'two', params: { answer: 42 } },
        { key: 'three-key', name: 'three', params: { name: 'Jane' } },
      ],
      history: [{ type: 'route', key: 'one-key' }],
    });

    next = router.getStateForRouteFocus(next, 'two-key');
    next = router.getStateForRouteFocus(next, 'three-key');
    next = router.getStateForRouteFocus(next, 'two-key');
    next = router.getStateForRouteFocus(next, 'two-key');

    expect(next.history).toEqual([
      { type: 'route', key: 'one-key' },
      { type: 'route', key: 'two-key', params: { answer: 42 } },
      { type: 'route', key: 'three-key', params: { name: 'Jane' } },
      { type: 'route', key: 'two-key', params: { answer: 42 } },
    ]);
  });

  test('SET_PARAMS and REPLACE_PARAMS update the latest params snapshot', () => {
    const router = TabRouter({ backBehavior: 'fullHistory' });
    let next = router.getStateForAction(
      state(['one', 'two'], 1, {
        routes: [
          { key: 'one-key', name: 'one' },
          { key: 'two-key', name: 'two', params: { value: 'old' } },
        ],
        history: [
          { type: 'route', key: 'two-key', params: { value: 'first' } },
          { type: 'route', key: 'one-key' },
          { type: 'route', key: 'two-key', params: { value: 'old' } },
        ],
      }),
      CommonActions.setParams({ value: 'set' }),
      options
    )!.state;
    expect(next.history).toEqual([
      { type: 'route', key: 'two-key', params: { value: 'first' } },
      { type: 'route', key: 'one-key' },
      { type: 'route', key: 'two-key', params: { value: 'set' } },
    ]);

    next = router.getStateForAction(
      next,
      CommonActions.replaceParams({ value: 'replaced' }),
      options
    )!.state;
    expect(next.history?.[2]?.params).toEqual({ value: 'replaced' });
  });

  test('PRELOAD re-keys duplicate visits but updates only the newest params snapshot', () => {
    const next = TabRouter({ backBehavior: 'fullHistory' }).getStateForAction(
      state(['one', 'two'], 1, {
        routes: [
          { key: 'one-key', name: 'one' },
          { key: 'two-old', name: 'two', params: { id: 'old', page: 2 } },
        ],
        history: [
          { type: 'route', key: 'two-old', params: { id: 'old', page: 1 } },
          { type: 'route', key: 'one-key' },
          { type: 'route', key: 'two-old', params: { id: 'old', page: 2 } },
        ],
      }),
      CommonActions.preload('two', { id: 'new' }),
      {
        ...options,
        routeGetIdList: { two: ({ params }) => params?.id as string | undefined },
      }
    )!.state;

    expect(next.routes[1]?.key).toBe('two:tab-0');
    expect(next.history).toEqual([
      { type: 'route', key: 'two:tab-0', params: { id: 'old', page: 1 } },
      { type: 'route', key: 'one-key' },
      { type: 'route', key: 'two:tab-0', params: { id: 'new' } },
    ]);
  });

  test('restores params for an undeclared focused route', () => {
    const router = TabRouter({ backBehavior: 'fullHistory' });
    const current = state(['one', 'zap'], 1, {
      routeNames: ['one'],
      routes: [
        { key: 'one-key', name: 'one' },
        { key: 'zap-key', name: 'zap', params: { answer: 42 } },
      ],
    });
    const navigated = router.getStateForAction(current, TabActions.jumpTo('one'), options)!.state;
    const backed = router.getStateForAction(navigated, CommonActions.goBack(), options)!.state;

    expect(backed.routes[1]?.params).toEqual({ answer: 42 });
  });
});

describe('additional reconciliation coverage', () => {
  test('fullHistory keeps an empty state without a back target', () => {
    const router = TabRouter({ backBehavior: 'fullHistory' });
    const empty = state([], -1, { routeNames: [] });
    const next = router.getStateForRouteFocus(empty, 'missing');

    expect(next.history).toEqual([]);
    expect(router.getStateForAction(next, CommonActions.goBack(), options)).toBeNull();
  });

  test('ROUTE_NAMES_CHANGED handles an empty declared set', () => {
    const next = TabRouter({}).getStateForAction(
      state(['one']),
      { type: 'ROUTE_NAMES_CHANGED', payload: { routeNames: [] } },
      { ...options, routeNames: [] }
    )!.state;

    expect(next).toMatchObject({ routeNames: [], routes: [], index: -1 });
    expect(next.history).toBeUndefined();
  });

  test('ROUTE_NAMES_CHANGED falls back to the first surviving route in state order', () => {
    const next = TabRouter({}).getStateForAction(
      state(['one', 'two', 'three'], 1),
      { type: 'ROUTE_NAMES_CHANGED', payload: { routeNames: ['three', 'one'] } },
      { ...options, routeNames: ['three', 'one'] }
    )!.state;

    expect(names(next)).toEqual(['one', 'three']);
    expect(next.routes[next.index]?.name).toBe('one');
  });

  test('ROUTE_NAMES_ORDER_CHANGED preserves the affected focused route key', () => {
    const result = TabRouter({ backBehavior: 'order' }).getStateForAction(
      state(['one', 'two', 'three', 'four'], 1),
      {
        type: 'ROUTE_NAMES_ORDER_CHANGED',
        payload: { routeNames: ['four', 'three', 'two', 'one'] },
      },
      options
    );

    expect(result?.affectedRouteKey).toBe('two-key');
  });
});
