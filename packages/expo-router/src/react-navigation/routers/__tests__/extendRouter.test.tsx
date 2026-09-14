import { describe, expect, test } from '@jest/globals';

import {
  StackActions,
  StackRouter,
  type StackActionType,
  type StackNavigationState,
} from '../StackRouter';
import {
  extendRouter,
  extendRouterActions,
  type RouterActionContext,
  type RouterExtensionContext,
} from '../extendRouter';
import type {
  CommonNavigationAction,
  DefaultRouterOptions,
  NavigationState,
  Router,
  RouterFactory,
} from '../types';

type CustomAction = {
  type: 'CUSTOM';
  payload: { value: number };
};

const config = { routeNames: ['index', 'second'], routeGetIdList: {} };
const state: NavigationState = {
  stale: false,
  type: 'test',
  key: 'navigator:root',
  routeKeySeq: 2,
  index: 1,
  routeNames: ['index', 'second'],
  routes: [
    { key: 'index:0', name: 'index' },
    { key: 'second:1', name: 'second' },
  ],
};
const stackState: StackNavigationState<Record<string, object | undefined>> = {
  ...state,
  type: 'stack',
};

const TestRouter: RouterFactory<
  NavigationState,
  CommonNavigationAction,
  DefaultRouterOptions
> = () => ({
  type: 'test',
  getStateForDeclaredRoutes: (state) => state,
  getStateForRouteFocus: (state) => state,
  getStateForAction: (state) => ({ state, affectedRouteKey: undefined }),
  shouldActionChangeFocus: () => false,
});

const uppercaseNames = (state: NavigationState) => ({
  ...state,
  routes: state.routes.map((route) => ({
    ...route,
    name: route.name.toUpperCase(),
  })),
});

describe('extendRouter', () => {
  test('merges the extension over the base router and passes the context', () => {
    const context: { baseRouterType?: string; initialRouteName?: string } = {};
    const router = extendRouter(TestRouter, ({ baseRouter, options }) => {
      context.baseRouterType = baseRouter.type;
      context.initialRouteName = options.initialRouteName;
      return {
        getStateForRouteFocus: (state) => ({ ...state, index: 0 }),
        actionCreators: {
          noop: () => ({ type: 'NOOP' }) as unknown as CommonNavigationAction,
        },
      };
    })({ initialRouteName: 'second' });

    expect(context).toEqual({
      baseRouterType: 'test',
      initialRouteName: 'second',
    });
    expect(router.type).toBe('test');
    expect(router.getStateForRouteFocus(state, 'index:0').index).toBe(0);
    expect(router.getStateForAction(state, { type: 'GO_BACK' }, config)?.state).toBe(state);
    expect(router.actionCreators?.noop).toBeDefined();
  });

  test('stamps the type from the options on the router and on focused and reduced states', () => {
    const untyped = { ...state, type: undefined };
    let seenType: string | undefined;
    const router = extendRouter(
      TestRouter,
      () => ({
        getStateForRouteFocus: (state) => {
          seenType = state.type;
          return state;
        },
      }),
      { type: 'custom' }
    )({});

    expect(router.type).toBe('custom');
    expect(router.getStateForDeclaredRoutes(untyped, config.routeNames).type).toBeUndefined();
    expect(router.getStateForRouteFocus(untyped, 'index:0').type).toBe('custom');
    expect(seenType).toBe('custom');
    expect(router.getStateForAction(untyped, { type: 'GO_BACK' }, config)?.state.type).toBe(
      'custom'
    );
  });

  test('uses the base router type when the options give none', () => {
    const router = extendRouter(TestRouter, () => ({}))({});

    expect(router.type).toBe('test');
    expect(router.getStateForRouteFocus({ ...state, type: undefined }, 'index:0').type).toBe(
      'test'
    );
  });

  test('applies normalizeState to every state the router returns', () => {
    const router = extendRouter(TestRouter, () => ({
      normalizeState: uppercaseNames,
    }))({});

    expect(router.getStateForDeclaredRoutes(state, config.routeNames).routes[0]?.name).toBe(
      'INDEX'
    );
    expect(router.getStateForRouteFocus(state, 'index:0').routes[0]?.name).toBe('INDEX');
    expect(
      router.getStateForAction(state, { type: 'GO_BACK' }, config)?.state.routes[0]?.name
    ).toBe('INDEX');
  });

  test('lets the extension replace the base router normalizeState', () => {
    const NormalizedRouter = extendRouter(TestRouter, () => ({ normalizeState: uppercaseNames }));
    const router = extendRouter(NormalizedRouter, () => ({
      normalizeState: (state) => ({ ...state, index: 0 }),
      getStateForRouteFocus: (state) => state,
    }))({});

    const result = router.getStateForRouteFocus(state, 'index:0');

    expect(result.index).toBe(0);
    expect(result.routes[0]?.name).toBe('index');
  });

  test('merges added action creators with the base router ones', () => {
    const first = () => ({ type: 'GO_BACK' }) as const;
    const second = () => ({ type: 'GO_BACK' }) as const;
    const FirstRouter = extendRouter(TestRouter, () => ({ actionCreators: { first } }));
    const router = extendRouter(FirstRouter, ({ baseRouter }) => ({
      actionCreators: { ...baseRouter.actionCreators, second },
    }))({});

    expect(router.actionCreators).toEqual({ first, second });
  });

  test('requires config when delegating outside of getStateForAction', () => {
    const router = extendRouter(TestRouter, ({ baseRouter }) => ({
      getStateForRouteFocus: (state) =>
        baseRouter.getStateForAction(state, { type: 'GO_BACK' })?.state ?? state,
    }))({});

    expect(() => router.getStateForRouteFocus(state, 'index:0')).toThrow(
      'needs the `config` argument'
    );
  });

  test('inherits normalizeState from the base router', () => {
    const NormalizedRouter = extendRouter(TestRouter, () => ({
      normalizeState: uppercaseNames,
    }));
    const router = extendRouter(NormalizedRouter, () => ({
      getStateForRouteFocus: (state) => ({ ...state, index: 0 }),
    }))({});

    const focused = router.getStateForRouteFocus(state, 'index:0');
    expect(focused.index).toBe(0);
    expect(focused.routes[0]?.name).toBe('INDEX');
  });

  test('mints route keys with nextKey and stamps routeKeySeq on every returned state', () => {
    const router = extendRouter(TestRouter, ({ nextKey }) => ({
      getStateForRouteFocus: (state) => ({
        ...state,
        routes: [...state.routes, { key: nextKey('index'), name: 'index' }],
      }),
    }))({});

    const focused = router.getStateForRouteFocus(state, 'index:0');

    expect(focused.routes[2]?.key).toBe('index:2');
    expect(focused.routeKeySeq).toBe(3);
  });

  test('can change the state, action, and options types', () => {
    type WideState = NavigationState & { type?: 'wide'; extra: number };
    type WideOptions = DefaultRouterOptions & { extra: number };
    const WideRouter = extendRouter(
      TestRouter,
      ({
        options,
      }: RouterExtensionContext<
        WideState,
        CommonNavigationAction | CustomAction,
        WideOptions
      >): Partial<Router<WideState, CommonNavigationAction | CustomAction>> => ({
        type: 'wide',
        getStateForAction: (state, action) =>
          action.type === 'CUSTOM'
            ? {
                state: {
                  ...state,
                  extra: options.extra + action.payload.value,
                },
                affectedRouteKey: undefined,
              }
            : null,
      })
    );

    const result = WideRouter({ extra: 1 }).getStateForAction(
      { ...state, type: 'wide', extra: 0 },
      { type: 'CUSTOM', payload: { value: 2 } },
      config
    );

    expect(result?.state.extra).toBe(3);
  });
});

describe('extendRouterActions', () => {
  test('falls through to the base router when the reducer returns undefined', () => {
    const router = extendRouterActions(StackRouter, () => undefined)({});

    const result = router.getStateForAction(stackState, StackActions.pop(1), config);

    expect(result?.state.routes).toHaveLength(1);
  });

  test('rejects the action when the reducer returns null', () => {
    const router = extendRouterActions(StackRouter, (state, action) =>
      action.type === 'POP' ? null : undefined
    )({});

    expect(router.getStateForAction(stackState, StackActions.pop(1), config)).toBeNull();
  });

  test('returns the result of a handled action', () => {
    const router = extendRouterActions(
      StackRouter,
      (state, action: StackActionType | CommonNavigationAction | CustomAction) =>
        action.type === 'CUSTOM'
          ? {
              state: { ...state, index: 0 },
              affectedRouteKey: state.routes[0]?.key,
            }
          : undefined
    )({});

    const result = router.getStateForAction(
      stackState,
      { type: 'CUSTOM', payload: { value: 1 } },
      config
    );

    expect(result?.state.index).toBe(0);
    expect(result?.affectedRouteKey).toBe('index:0');
  });

  test('lets the reducer delegate to the base router with a different action', () => {
    const router = extendRouterActions(
      StackRouter,
      (state, action: StackActionType | CommonNavigationAction | CustomAction, { baseRouter }) =>
        action.type === 'CUSTOM'
          ? baseRouter.getStateForAction(state, StackActions.pop(1), config)
          : undefined
    )({});

    const result = router.getStateForAction(
      stackState,
      { type: 'CUSTOM', payload: { value: 1 } },
      config
    );

    expect(result?.state.routes).toHaveLength(1);
  });

  test('delegates with the config of the reduced action when none is passed', () => {
    const RecordingRouter = extendRouter(TestRouter, () => ({
      getStateForAction: (state, action, config) => ({
        state: { ...state, routeNames: config.routeNames },
        affectedRouteKey: undefined,
      }),
    }));
    const router = extendRouterActions(RecordingRouter, (state, action, { baseRouter }) =>
      baseRouter.getStateForAction(state, action)
    )({});

    const result = router.getStateForAction(state, { type: 'GO_BACK' }, config);

    expect(result?.state.routeNames).toBe(config.routeNames);
  });

  test('mints route keys with nextKey and stamps routeKeySeq on the result', () => {
    const router = extendRouterActions(StackRouter, (state, action, { nextKey }) =>
      action.type === 'PUSH'
        ? {
            state: {
              ...state,
              index: state.index + 1,
              routes: [
                ...state.routes,
                {
                  key: nextKey(action.payload.name),
                  name: action.payload.name,
                },
              ],
            },
            affectedRouteKey: undefined,
          }
        : undefined
    )({});

    const result = router.getStateForAction(stackState, StackActions.push('second'), config);

    expect(result?.state.routes[2]?.key).toBe('second:2');
    expect(result?.state.routeKeySeq).toBe(3);
  });

  test('does not reuse a key minted before delegating to the base router', () => {
    const router = extendRouterActions(StackRouter, (state, action, { baseRouter, nextKey }) => {
      if (action.type !== 'PUSH') {
        return undefined;
      }
      const key = nextKey('index');
      const result = baseRouter.getStateForAction(state, action, config);
      return (
        result && {
          ...result,
          state: {
            ...result.state,
            routes: [...result.state.routes, { key, name: 'index' }],
          },
        }
      );
    })({});

    const result = router.getStateForAction(stackState, StackActions.push('second'), config);
    const keys = result?.state.routes.map((route) => route.key);

    expect(keys).toEqual(['index:0', 'second:1', 'second:3', 'index:2']);
    expect(result?.state.routeKeySeq).toBe(4);
  });

  test('does not reuse a key minted after delegating to the base router', () => {
    const router = extendRouterActions(StackRouter, (state, action, { baseRouter, nextKey }) => {
      if (action.type !== 'PUSH') {
        return undefined;
      }
      const result = baseRouter.getStateForAction(state, action, config);
      return (
        result && {
          ...result,
          state: {
            ...result.state,
            routes: [...result.state.routes, { key: nextKey('index'), name: 'index' }],
          },
        }
      );
    })({});

    const result = router.getStateForAction(stackState, StackActions.push('second'), config);
    const keys = result?.state.routes.map((route) => route.key);

    expect(keys).toEqual(['index:0', 'second:1', 'second:2', 'index:3']);
    expect(result?.state.routeKeySeq).toBe(4);
  });

  test('keeps a higher routeKeySeq produced by the base router', () => {
    const router = extendRouterActions(StackRouter, (state, action, { baseRouter, nextKey }) => {
      if (action.type !== 'RESET') {
        return undefined;
      }
      nextKey('index');
      return baseRouter.getStateForAction(state, action, config);
    })({});

    const result = router.getStateForAction(
      stackState,
      { type: 'RESET', payload: { ...stackState, routeKeySeq: 10 } },
      config
    );

    expect(result?.state.routeKeySeq).toBe(10);
  });

  test('passes widened router options to the reducer', () => {
    type Options = DefaultRouterOptions & { extra: string };
    const seen: string[] = [];
    const router = extendRouterActions(
      StackRouter,
      (
        state,
        action,
        {
          options,
        }: RouterActionContext<
          StackNavigationState<Record<string, object | undefined>>,
          StackActionType | CommonNavigationAction,
          Options
        >
      ) => {
        seen.push(options.extra);
        return undefined;
      }
    )({ extra: 'value' });

    router.getStateForAction(stackState, StackActions.pop(1), config);

    expect(seen).toEqual(['value']);
  });

  test('preserves custom action types', () => {
    const router = extendRouterActions(
      StackRouter,
      (state, action: StackActionType | CommonNavigationAction | CustomAction) => {
        if (action.type === 'CUSTOM') {
          action.payload.value satisfies number;
          return { state, affectedRouteKey: undefined };
        }
        return undefined;
      }
    )({});

    const result = router.getStateForAction(
      stackState,
      { type: 'CUSTOM', payload: { value: 1 } },
      config
    );
    const invalidResult = router.getStateForAction(
      stackState,
      // @ts-expect-error Custom action payload is checked by the extended router factory.
      { type: 'CUSTOM', payload: { value: 'invalid' } },
      config
    );

    expect(result).not.toBeNull();
    expect(invalidResult).not.toBeNull();
  });
});
