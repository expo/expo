import {
  INTERNAL_EXPO_ROUTER_NO_ANIMATION_PARAM_NAME,
  INTERNAL_EXPO_ROUTER_ZOOM_TRANSITION_SCREEN_ID_PARAM_NAME,
  INTERNAL_EXPO_ROUTER_ZOOM_TRANSITION_SOURCE_ID_PARAM_NAME,
} from '../../navigationParams';
import { createInitialState } from '../../react-navigation/core/createInitialState';
import { CommonActions, type RouterConfigOptions } from '../../react-navigation/native';
import type { ParamListBase, TabNavigationState } from '../../react-navigation/routers';
import { NativeBottomTabsRouter } from '../NativeBottomTabsRouter';

jest.mock('nanoid/non-secure', () => ({ nanoid: jest.fn(() => 'test') }));

let warn: jest.SpyInstance;

beforeEach(() => {
  warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => {
  warn.mockRestore();
});

test('post-processes a first navigation to an unvisited tab', () => {
  const router = NativeBottomTabsRouter({});
  const options: RouterConfigOptions = {
    routeNames: ['index', 'second'],
    routeGetIdList: {},
  };
  const state = createInitialState<TabNavigationState<ParamListBase>>(options);

  const { state: result, affectedRouteKey } = router.getStateForAction(
    state,
    CommonActions.navigate('second', {
      screen: 'nested',
      [INTERNAL_EXPO_ROUTER_ZOOM_TRANSITION_SCREEN_ID_PARAM_NAME]: 'screen-id',
      [INTERNAL_EXPO_ROUTER_ZOOM_TRANSITION_SOURCE_ID_PARAM_NAME]: 'source-id',
    }),
    options
  )!;
  const route = result.routes[result.index!]!;
  const params = route.params as Record<string, unknown>;

  expect(route.name).toBe('second');
  expect(affectedRouteKey).toBe(route.key);
  expect(params[INTERNAL_EXPO_ROUTER_NO_ANIMATION_PARAM_NAME]).toBe(true);
  expect(params).not.toHaveProperty(INTERNAL_EXPO_ROUTER_ZOOM_TRANSITION_SCREEN_ID_PARAM_NAME);
  expect(params).not.toHaveProperty(INTERNAL_EXPO_ROUTER_ZOOM_TRANSITION_SOURCE_ID_PARAM_NAME);
  expect(params.params).toEqual({ [INTERNAL_EXPO_ROUTER_NO_ANIMATION_PARAM_NAME]: true });
  expect(warn).toHaveBeenCalledWith(
    'Zoom transition is not supported when navigating between tabs. Falling back to standard navigation transition.'
  );
});

test('preserves trusted carried state while post-processing navigation', () => {
  const router = NativeBottomTabsRouter({});
  const options: RouterConfigOptions = {
    routeNames: ['index', 'second'],
    routeGetIdList: {},
  };
  const childState = { routes: [{ name: 'nested' }], __internal__routerActionState: true as const };
  const state = createInitialState<TabNavigationState<ParamListBase>>(options);

  const result = router.getStateForAction(
    state,
    {
      type: 'NAVIGATE',
      payload: { name: 'second', state: childState },
    },
    options
  );

  expect(result?.state.routes[result.state.index ?? -1]?.state).toBe(childState);
});

test('warns once when navigation carries untrusted state', () => {
  const router = NativeBottomTabsRouter({});
  const options: RouterConfigOptions = {
    routeNames: ['index', 'second'],
    routeGetIdList: {},
  };
  const state = createInitialState<TabNavigationState<ParamListBase>>(options);

  router.getStateForAction(
    state,
    { type: 'NAVIGATE', payload: { name: 'second', state: { routes: [{ name: 'nested' }] } } },
    options
  );

  expect(warn).toHaveBeenCalledTimes(1);
});
