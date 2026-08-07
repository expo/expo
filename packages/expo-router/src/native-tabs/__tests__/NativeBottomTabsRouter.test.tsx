import {
  INTERNAL_EXPO_ROUTER_NO_ANIMATION_PARAM_NAME,
  INTERNAL_EXPO_ROUTER_ZOOM_TRANSITION_SCREEN_ID_PARAM_NAME,
  INTERNAL_EXPO_ROUTER_ZOOM_TRANSITION_SOURCE_ID_PARAM_NAME,
} from '../../navigationParams';
import { CommonActions, type RouterConfigOptions } from '../../react-navigation/native';
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
    routeParamList: {},
    routeGetIdList: {},
  };
  const state = router.getInitialState(options);

  const result = router.getStateForAction(
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
  expect(params[INTERNAL_EXPO_ROUTER_NO_ANIMATION_PARAM_NAME]).toBe(true);
  expect(params).not.toHaveProperty(INTERNAL_EXPO_ROUTER_ZOOM_TRANSITION_SCREEN_ID_PARAM_NAME);
  expect(params).not.toHaveProperty(INTERNAL_EXPO_ROUTER_ZOOM_TRANSITION_SOURCE_ID_PARAM_NAME);
  expect(params.params).toEqual({ [INTERNAL_EXPO_ROUTER_NO_ANIMATION_PARAM_NAME]: true });
  expect(warn).toHaveBeenCalledWith(
    'Zoom transition is not supported when navigating between tabs. Falling back to standard navigation transition.'
  );
});

test('post-processes pure navigator params while preserving the preallocated key', () => {
  const router = NativeBottomTabsRouter({});
  const options: RouterConfigOptions = {
    routeNames: ['index', 'second'],
    routeParamList: {},
    routeGetIdList: {},
  };
  const state = router.getInitialState(options);

  const result = router.getStateForNavigatorParams!(
    state,
    {
      screen: 'second',
      params: {
        screen: 'nested',
        [INTERNAL_EXPO_ROUTER_ZOOM_TRANSITION_SOURCE_ID_PARAM_NAME]: 'source-id',
      },
      routeKey: 'second-preallocated',
    },
    options
  )!;
  const route = result.routes[result.index!]!;

  expect(route.key).toBe('second-preallocated');
  expect(route.params).toMatchObject({
    screen: 'nested',
    [INTERNAL_EXPO_ROUTER_NO_ANIMATION_PARAM_NAME]: true,
  });
  expect(route.params).not.toHaveProperty(
    INTERNAL_EXPO_ROUTER_ZOOM_TRANSITION_SOURCE_ID_PARAM_NAME
  );
});

test('post-processes stale navigator params before rehydration', () => {
  const router = NativeBottomTabsRouter({});
  const options: RouterConfigOptions = {
    routeNames: ['index', 'second'],
    routeParamList: {},
    routeGetIdList: {},
  };

  const result = router.getStateForNavigatorParams!(
    { key: 'tab', routes: [{ key: 'index', name: 'index' }] },
    {
      screen: 'second',
      params: {
        screen: 'nested',
        [INTERNAL_EXPO_ROUTER_ZOOM_TRANSITION_SOURCE_ID_PARAM_NAME]: 'source-id',
      },
      routeKey: 'second-preallocated',
    },
    options
  )!;
  const route = result.routes[result.index!]!;

  expect(route.params).toMatchObject({
    screen: 'nested',
    [INTERNAL_EXPO_ROUTER_NO_ANIMATION_PARAM_NAME]: true,
  });
  expect(route.params).not.toHaveProperty(
    INTERNAL_EXPO_ROUTER_ZOOM_TRANSITION_SOURCE_ID_PARAM_NAME
  );
});
