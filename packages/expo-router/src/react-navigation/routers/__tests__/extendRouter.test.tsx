import { expect, test } from '@jest/globals';

import { StackActions, type StackNavigationState } from '../StackRouter';
import type { TabNavigationState } from '../TabRouter';
import {
  extendStackRouterActions,
  extendTabRouterActions,
  type RouterActionExtension,
} from '../extendRouter';
import type { DefaultRouterOptions, ParamListBase } from '../types';

type CustomAction = {
  type: 'CUSTOM';
  payload: { value: number };
};

const options = { routeNames: ['index', 'second'], routeGetIdList: {} };
const stackState: StackNavigationState<ParamListBase> = {
  stale: false,
  type: 'stack',
  key: 'stack',
  routeKeySeq: 2,
  index: 1,
  routeNames: ['index', 'second'],
  routes: [
    { key: 'index', name: 'index' },
    { key: 'second', name: 'second' },
  ],
};
const tabState: TabNavigationState<ParamListBase> = {
  ...stackState,
  type: 'tab',
  key: 'tab',
  history: [],
};

test('normalizes preload markers for an extended stack router', () => {
  const router = extendStackRouterActions<CustomAction>((state, action) => {
    if (action.type !== 'CUSTOM') {
      return null;
    }
    return {
      state: {
        ...state,
        index: 0,
        routes: state.routes.map((route) => ({ ...route, isPreloaded: true as const })),
      },
      affectedRouteKey: state.routes[state.index]?.key,
    };
  })({});

  const result = router.getStateForAction(
    stackState,
    { type: 'CUSTOM', payload: { value: 1 } },
    options
  );

  expect(result).not.toBeNull();
  expect(result!.state.routes[0]?.isPreloaded).toBeUndefined();
  expect(result!.state.routes[1]?.isPreloaded).toBe(true);
});

test('clears only the focused preload marker for an extended tab router', () => {
  const router = extendTabRouterActions<CustomAction>((state, action) => {
    if (action.type !== 'CUSTOM') {
      return null;
    }
    return {
      state: {
        ...state,
        routes: state.routes.map((route) => ({ ...route, isPreloaded: true as const })),
      },
      affectedRouteKey: state.routes[state.index]?.key,
    };
  })({});

  const result = router.getStateForAction(
    tabState,
    { type: 'CUSTOM', payload: { value: 1 } },
    options
  );

  expect(result).not.toBeNull();
  expect(result!.state.routes[0]?.isPreloaded).toBe(true);
  expect(result!.state.routes[1]?.isPreloaded).toBeUndefined();
});

test('runs the extension before the base router', () => {
  const router = extendStackRouterActions((state) => ({
    state,
    affectedRouteKey: undefined,
  }))({});

  const result = router.getStateForAction(stackState, StackActions.pop(1), options);

  expect(result?.state.routes).toHaveLength(2);
});

test('allows the extension to delegate to the base action handler', () => {
  const router = extendStackRouterActions<CustomAction>(
    (state, action, options, baseActionHandler) =>
      action.type === 'CUSTOM' ? baseActionHandler(state, StackActions.pop(1), options) : null
  )({});

  const result = router.getStateForAction(
    stackState,
    { type: 'CUSTOM', payload: { value: 1 } },
    options
  );

  expect(result?.state.routes).toHaveLength(1);
});

test('falls back to the base router when the extension does not handle an action', () => {
  const router = extendStackRouterActions(() => null)({});

  const result = router.getStateForAction(stackState, StackActions.pop(1), options);

  expect(result?.state.routes).toHaveLength(1);
});

test('preserves custom action types', () => {
  const namedExtension: RouterActionExtension<
    StackNavigationState<ParamListBase>,
    CustomAction,
    DefaultRouterOptions
  > = (state) => ({ state, affectedRouteKey: undefined });
  const customActionRouter = extendStackRouterActions<CustomAction>(
    (state, action, options, baseActionHandler) => {
      if (action.type === 'CUSTOM') {
        action.payload.value satisfies number;
        return { state, affectedRouteKey: undefined };
      }
      return baseActionHandler(state, action, options);
    }
  );

  const result = customActionRouter({}).getStateForAction(
    stackState,
    { type: 'CUSTOM', payload: { value: 1 } },
    options
  );

  const tabResult = extendTabRouterActions<CustomAction>(
    (state, action, options, baseActionHandler) => baseActionHandler(state, action, options)
  )({}).getStateForAction(tabState, { type: 'CUSTOM', payload: { value: 1 } }, options);

  if (false) {
    customActionRouter({}).getStateForAction(
      stackState,
      // @ts-expect-error Custom action payload is checked by the extended router factory.
      { type: 'CUSTOM', payload: { value: 'invalid' } },
      options
    );
  }

  expect(result).not.toBeNull();
  expect(tabResult).toBeNull();
  expect(namedExtension).toBeInstanceOf(Function);
});
