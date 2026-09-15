import {
  INTERNAL_EXPO_ROUTER_NO_ANIMATION_PARAM_NAME,
  INTERNAL_EXPO_ROUTER_ZOOM_TRANSITION_SCREEN_ID_PARAM_NAME,
  INTERNAL_EXPO_ROUTER_ZOOM_TRANSITION_SOURCE_ID_PARAM_NAME,
} from '../../navigationParams';
import { createInitialState } from '../../react-navigation/core/createInitialState';
import { CommonActions, type RouterConfigOptions } from '../../react-navigation/native';
import type { ParamListBase, TabNavigationState } from '../../react-navigation/routers';
import { NativeBottomTabsRouter } from '../NativeBottomTabsRouter';

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
  const state = createInitialState<TabNavigationState<ParamListBase>>({
    ...options,
    parentChain: 'test',
  });

  const destinationState = {
    routes: [
      {
        name: 'nested',
        params: {
          [INTERNAL_EXPO_ROUTER_ZOOM_TRANSITION_SCREEN_ID_PARAM_NAME]: 'nested-screen-id',
          [INTERNAL_EXPO_ROUTER_ZOOM_TRANSITION_SOURCE_ID_PARAM_NAME]: 'nested-source-id',
        },
        state: {
          routes: [
            {
              name: 'deep',
              params: {
                value: 'kept',
                [INTERNAL_EXPO_ROUTER_ZOOM_TRANSITION_SCREEN_ID_PARAM_NAME]: 'deep-screen-id',
                [INTERNAL_EXPO_ROUTER_ZOOM_TRANSITION_SOURCE_ID_PARAM_NAME]: 'deep-source-id',
              },
            },
          ],
          __internal__routerActionState: true as const,
        },
      },
    ],
    __internal__routerActionState: true as const,
  };

  const { state: result, affectedRouteKey } = router.getStateForAction(
    state,
    {
      type: 'NAVIGATE',
      payload: {
        name: 'second',
        params: {
          [INTERNAL_EXPO_ROUTER_ZOOM_TRANSITION_SCREEN_ID_PARAM_NAME]: 'screen-id',
          [INTERNAL_EXPO_ROUTER_ZOOM_TRANSITION_SOURCE_ID_PARAM_NAME]: 'source-id',
        },
        state: destinationState,
      },
    },
    options
  )!;
  const route = result.routes[result.index!]!;
  const params = route.params as Record<string, unknown>;

  expect(route.name).toBe('second');
  expect(affectedRouteKey).toBe(route.key);
  expect(params).not.toHaveProperty(INTERNAL_EXPO_ROUTER_NO_ANIMATION_PARAM_NAME);
  expect(params).not.toHaveProperty(INTERNAL_EXPO_ROUTER_ZOOM_TRANSITION_SCREEN_ID_PARAM_NAME);
  expect(params).not.toHaveProperty(INTERNAL_EXPO_ROUTER_ZOOM_TRANSITION_SOURCE_ID_PARAM_NAME);
  expect(route.state?.routes[0]?.params).toEqual({
    [INTERNAL_EXPO_ROUTER_NO_ANIMATION_PARAM_NAME]: true,
  });
  expect(route.state?.routes[0]?.state?.routes[0]?.params).toEqual({
    value: 'kept',
    [INTERNAL_EXPO_ROUTER_NO_ANIMATION_PARAM_NAME]: true,
  });
  expect(warn).toHaveBeenCalledWith(
    'Zoom transition is not supported when navigating between tabs. Falling back to standard navigation transition.'
  );
});

test('does not disable animation when navigating within the focused tab', () => {
  const router = NativeBottomTabsRouter({});
  const options: RouterConfigOptions = {
    routeNames: ['index', 'second'],
    routeGetIdList: {},
  };
  const state = createInitialState<TabNavigationState<ParamListBase>>({
    ...options,
    parentChain: 'test',
  });

  const result = router.getStateForAction(
    state,
    {
      type: 'NAVIGATE',
      payload: {
        name: 'index',
        state: {
          routes: [
            {
              name: 'nested',
              state: {
                routes: [{ name: 'deep' }],
              },
            },
          ],
          __internal__routerActionState: true,
        },
      },
    },
    options
  )!;
  const route = result.state.routes[result.state.index!]!;

  expect(route.params).toBeUndefined();
  expect(route.state?.routes[0]?.params).toBeUndefined();
  expect(route.state?.routes[0]?.state?.routes[0]?.params).toBeUndefined();
});

test('does not disable animation for a tab-bar navigation action', () => {
  const router = NativeBottomTabsRouter({});
  const options: RouterConfigOptions = {
    routeNames: ['index', 'second'],
    routeGetIdList: {},
  };
  const state = createInitialState<TabNavigationState<ParamListBase>>({
    ...options,
    parentChain: 'test',
  });

  const result = router.getStateForAction(state, CommonActions.navigate('second'), options)!;
  const route = result.state.routes[result.state.index!]!;

  expect(route.params).toBeUndefined();
});

test('does not treat a screen param as a deep destination', () => {
  const router = NativeBottomTabsRouter({});
  const options: RouterConfigOptions = {
    routeNames: ['index', 'second'],
    routeGetIdList: {},
  };
  const state = createInitialState<TabNavigationState<ParamListBase>>({
    ...options,
    parentChain: 'test',
  });

  const result = router.getStateForAction(
    state,
    CommonActions.navigate('second', { screen: 'ordinary-user-param' }),
    options
  )!;

  expect(result.state.routes[result.state.index!]?.params).toEqual({
    screen: 'ordinary-user-param',
  });
});
