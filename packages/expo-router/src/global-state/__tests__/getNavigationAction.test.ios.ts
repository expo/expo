import type { ResultState } from '../../fork/getStateFromPath';
import { applyRedirects } from '../../getRoutesRedirects';
import type { NavigationState } from '../../react-navigation/native';
import { composeNavigationState, DEFER_NAVIGATION } from '../composeNavigationState';
import { getNavigateAction } from '../getNavigationAction';
import { findDivergentState } from '../stateUtils';
import { store } from '../store';

jest.mock('../store', () => ({
  store: {
    assertIsReady: jest.fn(),
    navigationRef: {
      current: {
        getRootState: jest.fn(),
      },
    },
    linking: {
      getStateFromPath: jest.fn(),
      config: {},
    },
    getRouteInfo: jest.fn(() => ({ pathname: '/', segments: [], params: {} })),
    redirects: [],
  },
}));

jest.mock('../stateUtils', () => ({ findDivergentState: jest.fn() }));
jest.mock('../composeNavigationState', () => ({
  ...jest.requireActual('../composeNavigationState'),
  composeNavigationState: jest.fn(),
}));
jest.mock('../../getRoutesRedirects', () => ({
  applyRedirects: jest.fn((href: string) => href),
}));
jest.mock('../../link/href', () => ({
  resolveHrefStringWithSegments: jest.fn((href: string) => href),
}));

const rootState: NavigationState = {
  stale: false,
  type: 'stack',
  key: 'root-state',
  index: 0,
  routeNames: ['home'],
  routes: [{ key: 'home-key', name: 'home' }],
};
let actionState: ResultState;
const registry = new Map();

const mockFindDivergentState = jest.mocked(findDivergentState);
const mockComposeNavigationState = jest.mocked(composeNavigationState);
const mockApplyRedirects = jest.mocked(applyRedirects);

beforeEach(() => {
  jest.clearAllMocks();
  actionState = { routes: [{ name: 'home' }] };
  (store.navigationRef.current!.getRootState as jest.Mock).mockReturnValue(rootState);
  (store.linking!.getStateFromPath as jest.Mock).mockReturnValue(actionState);
  mockFindDivergentState.mockReturnValue({
    actionState,
    navigationState: rootState,
    actionStateRoute: actionState.routes[0],
    navigationRoutes: [],
  });
});

describe(getNavigateAction, () => {
  it('propagates readiness errors', () => {
    jest.mocked(store.assertIsReady).mockImplementationOnce(() => {
      throw new Error('Not ready');
    });

    expect(() =>
      getNavigateAction('/home', {}, 'NAVIGATE', false, undefined, false, registry)
    ).toThrow('Not ready');
  });

  it('throws without a navigation container', () => {
    const current = store.navigationRef.current;
    store.navigationRef.current = null;

    try {
      expect(() =>
        getNavigateAction('/home', {}, 'NAVIGATE', false, undefined, false, registry)
      ).toThrow("Couldn't find a navigation object");
    } finally {
      store.navigationRef.current = current;
    }
  });

  it('throws without a linking configuration', () => {
    const linking = store.linking;
    Object.defineProperty(store, 'linking', { value: null, configurable: true });

    try {
      expect(() =>
        getNavigateAction('/home', {}, 'NAVIGATE', false, undefined, false, registry)
      ).toThrow('Attempted to link to route when no routes are present');
    } finally {
      Object.defineProperty(store, 'linking', { value: linking, configurable: true });
    }
  });

  it('returns undefined when a redirect handles navigation', () => {
    mockApplyRedirects.mockReturnValueOnce(undefined);

    expect(
      getNavigateAction('/home', {}, 'NAVIGATE', false, undefined, false, registry)
    ).toBeUndefined();
  });

  it('returns a targeted action with flat params for shallow navigation', () => {
    actionState = {
      routes: [
        {
          name: 'home',
          params: { screen: 'ordinary', params: 'ordinary', initial: 'ordinary' },
        },
      ],
    };
    (store.linking!.getStateFromPath as jest.Mock).mockReturnValue(actionState);
    mockFindDivergentState.mockReturnValue({
      actionState,
      navigationState: rootState,
      actionStateRoute: actionState.routes[0],
      navigationRoutes: [],
    });

    expect(getNavigateAction('/home', {}, 'NAVIGATE', false, undefined, false, registry)).toEqual({
      type: 'NAVIGATE',
      target: 'root-state',
      payload: {
        name: 'home',
        params: { screen: 'ordinary', params: 'ordinary', initial: 'ordinary' },
        singular: undefined,
      },
    });
    expect(mockComposeNavigationState).not.toHaveBeenCalled();
  });

  it('uses JUMP_TO for PUSH targeting an expo tab navigator', () => {
    const tabState = { ...rootState, type: 'tab' };
    const tabRegistry = new Map([
      ['root-state', { routerType: 'expo-tab', reduce: (state: NavigationState) => state }],
    ]);
    mockFindDivergentState.mockReturnValue({
      actionState,
      navigationState: tabState,
      actionStateRoute: actionState.routes[0],
      navigationRoutes: [],
    });

    expect(getNavigateAction('/home', {}, 'PUSH', false, undefined, false, tabRegistry)).toEqual(
      expect.objectContaining({ type: 'JUMP_TO' })
    );
  });

  it.each(['tab', 'drawer'])('preserves PUSH targeting a %s navigator', (type) => {
    const navigationState = { ...rootState, type };
    mockFindDivergentState.mockReturnValue({
      actionState,
      navigationState,
      actionStateRoute: actionState.routes[0],
      navigationRoutes: [],
    });

    expect(getNavigateAction('/home', {}, 'PUSH', false, undefined, false, registry)).toEqual(
      expect.objectContaining({ type: 'PUSH' })
    );
  });

  it('returns a targeted RESET for deep navigation', () => {
    const deepActionState = {
      routes: [{ name: 'parent', state: { routes: [{ name: 'child' }] } }],
    };
    const composedState = { ...rootState, routes: [{ key: 'parent-key', name: 'parent' }] };
    (store.linking!.getStateFromPath as jest.Mock).mockReturnValue(deepActionState);
    mockFindDivergentState.mockReturnValue({
      actionState: deepActionState,
      navigationState: rootState,
      actionStateRoute: deepActionState.routes[0],
      navigationRoutes: [],
    });
    mockComposeNavigationState.mockReturnValue(composedState);

    expect(getNavigateAction('/parent/child', {}, 'PUSH', false, true, false, registry)).toEqual({
      type: 'RESET',
      target: 'root-state',
      payload: composedState,
    });
    expect(mockComposeNavigationState).toHaveBeenCalledWith({
      navigationState: rootState,
      actionState: deepActionState,
      actionType: 'PUSH',
      registry,
      withAnchor: false,
      singular: true,
      internalParams: {},
    });
  });

  it('propagates registry deferral', () => {
    const deepActionState = {
      routes: [{ name: 'parent', state: { routes: [{ name: 'child' }] } }],
    };
    mockFindDivergentState.mockReturnValue({
      actionState: deepActionState,
      navigationState: rootState,
      actionStateRoute: deepActionState.routes[0],
      navigationRoutes: [],
    });
    mockComposeNavigationState.mockReturnValue(DEFER_NAVIGATION);

    expect(
      getNavigateAction('/parent/child', {}, 'NAVIGATE', false, undefined, false, registry)
    ).toBe(DEFER_NAVIGATION);
  });

  it('returns undefined when no divergent route or navigator exists', () => {
    mockFindDivergentState.mockReturnValue({
      actionState: { routes: [] },
      navigationState: rootState,
      actionStateRoute: undefined,
      navigationRoutes: [],
    });

    expect(getNavigateAction('/home', {}, 'NAVIGATE', false, undefined, false, registry)).toBe(
      undefined
    );
  });

  it('applies redirects for ordinary navigation', () => {
    getNavigateAction('/home', {}, 'NAVIGATE', false, undefined, false, registry);

    expect(mockApplyRedirects).toHaveBeenCalledWith('/home', store.redirects);
  });

  it('passes preview params and singular options to a shallow action', () => {
    expect(getNavigateAction('/home', {}, 'NAVIGATE', false, true, true, registry)).toEqual(
      expect.objectContaining({
        payload: expect.objectContaining({
          params: {
            __internal__expo_router_is_preview_navigation: true,
            __internal_expo_router_no_animation: true,
          },
          singular: true,
        }),
      })
    );
  });

  it('looks through all tabs only when preloading', () => {
    getNavigateAction('/home', {}, 'PRELOAD', false, undefined, false, registry);
    expect(mockFindDivergentState).toHaveBeenLastCalledWith(actionState, rootState, true);

    getNavigateAction('/home', {}, 'NAVIGATE', false, undefined, false, registry);
    expect(mockFindDivergentState).toHaveBeenLastCalledWith(actionState, rootState, false);
  });

  it('returns undefined for invalid parsed state', () => {
    (store.linking!.getStateFromPath as jest.Mock).mockReturnValue(undefined);
    const error = jest.spyOn(console, 'error').mockImplementation(() => {});

    expect(getNavigateAction('/missing', {}, 'NAVIGATE', false, undefined, false, registry)).toBe(
      undefined
    );
    expect(error).toHaveBeenCalledWith(expect.stringContaining('/missing'));
    error.mockRestore();
  });
});
