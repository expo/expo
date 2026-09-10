import { expect, test } from '@jest/globals';

import type { StackNavigationState } from '../StackRouter';
import type { TabNavigationState } from '../TabRouter';
import { extendStackRouterActions, extendTabRouterActions } from '../extendRouter';
import type { ParamListBase } from '../types';

type CustomAction = {
  type: 'CUSTOM';
  payload: { value: number };
};
const options = { routeNames: ['index'], routeGetIdList: {} };
const stackState: StackNavigationState<ParamListBase> = {
  stale: false,
  type: 'stack',
  key: 'stack',
  routeKeySeq: 1,
  index: 0,
  routeNames: ['index'],
  routes: [{ key: 'index', name: 'index' }],
};
const tabState: TabNavigationState<ParamListBase> = {
  ...stackState,
  type: 'tab',
  key: 'tab',
  history: [],
};

test('clears the focused route preload marker for an extended stack router', () => {
  const router = extendStackRouterActions<CustomAction>((state, action, _options, result) => {
    if (action.type !== 'CUSTOM') {
      return result;
    }
    return {
      state: {
        ...state,
        routes: state.routes.map((route) => ({
          ...route,
          isPreloaded: true as const,
        })),
      },
      affectedRouteKey: state.routes[state.index]?.key,
    };
  })({});

  const result = router.getStateForAction(
    stackState,
    { type: 'CUSTOM', payload: { value: 1 } },
    options
  );

  expect(result?.state.routes[result.state.index]?.isPreloaded).toBeUndefined();
});

test('clears the focused route preload marker for an extended tab router', () => {
  const router = extendTabRouterActions<CustomAction>((state, action, _options, result) => {
    if (action.type !== 'CUSTOM') {
      return result;
    }
    return {
      state: {
        ...state,
        routes: state.routes.map((route) => ({
          ...route,
          isPreloaded: true as const,
        })),
      },
      affectedRouteKey: state.routes[state.index]?.key,
    };
  })({});

  const result = router.getStateForAction(
    tabState,
    { type: 'CUSTOM', payload: { value: 1 } },
    options
  );

  expect(result?.state.routes[result.state.index]?.isPreloaded).toBeUndefined();
});

const customActionRouter = extendStackRouterActions<CustomAction>(
  (state, action, _options, result) => {
    if (action.type === 'CUSTOM') {
      action.payload.value satisfies number;
      return { state, affectedRouteKey: undefined };
    }
    return result;
  }
);

customActionRouter({}).getStateForAction(
  stackState,
  { type: 'CUSTOM', payload: { value: 1 } },
  options
);

extendTabRouterActions<CustomAction>((state, action, _options, result) => result)(
  {}
).getStateForAction(tabState, { type: 'CUSTOM', payload: { value: 1 } }, options);

customActionRouter({}).getStateForAction(
  stackState,
  // @ts-expect-error Custom action payload is checked by the extended router factory.
  { type: 'CUSTOM', payload: { value: 'invalid' } },
  options
);
