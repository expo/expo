import { applyRedirects } from '../../getRoutesRedirects';
import { getNavigateAction } from '../getNavigationAction';
import { findDivergentState, getPayloadFromStateRoute } from '../stateUtils';
import { store } from '../store';

jest.mock('../store', () => ({
  store: {
    assertIsReady: jest.fn(),
    navigationRef: {
      isReady: jest.fn(() => true),
      current: {
        canGoBack: jest.fn(),
        setParams: jest.fn(),
        goBack: jest.fn(),
        getRootState: jest.fn(() => ({
          routes: [{ key: 'root-key', name: '__root' }],
          index: 0,
          key: 'root-nav',
          type: 'stack',
          routeNames: ['__root'],
          stale: false,
        })),
        dispatch: jest.fn(),
      },
    },
    state: undefined as any,
    linking: {
      getStateFromPath: jest.fn(),
      config: {},
    },
    getRouteInfo: jest.fn(() => ({
      pathname: '/',
      segments: [],
      params: {},
    })),
    redirects: [],
  },
}));

jest.mock('../stateUtils', () => ({
  findDivergentState: jest.fn(),
  getPayloadFromStateRoute: jest.fn(),
}));

jest.mock('../../getRoutesRedirects', () => ({
  applyRedirects: jest.fn((href: string) => href),
}));

jest.mock('../../link/href', () => ({
  resolveHrefStringWithSegments: jest.fn((href: string) => href),
}));

const mockFindDivergentState = findDivergentState as jest.MockedFunction<typeof findDivergentState>;
const mockGetPayload = getPayloadFromStateRoute as jest.MockedFunction<
  typeof getPayloadFromStateRoute
>;
const mockApplyRedirects = applyRedirects as jest.MockedFunction<typeof applyRedirects>;

function setupDefaultMocks() {
  (store.linking!.getStateFromPath as jest.Mock).mockReturnValue({
    routes: [{ name: 'home' }],
  });

  mockFindDivergentState.mockReturnValue({
    actionState: { routes: [{ name: 'home' }] },
    navigationState: {
      key: 'nav-key',
      type: 'stack',
      routes: [{ key: 'root-key', name: '__root' }],
      index: 0,
      routeNames: ['__root'],
      stale: false,
    },
    actionStateRoute: { name: 'home' },
    navigationRoutes: [],
  });

  mockGetPayload.mockReturnValue({
    screen: 'home',
    params: {},
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  setupDefaultMocks();
});

describe(getNavigateAction, () => {
  it('throws when navigation is not ready (assertIsReady throws)', () => {
    (store.assertIsReady as jest.Mock).mockImplementationOnce(() => {
      throw new Error('Not ready');
    });

    expect(() => getNavigateAction('/home', {})).toThrow('Not ready');
  });

  it('throws when navigationRef.current is null', () => {
    const originalCurrent = store.navigationRef.current;
    (store.navigationRef as any).current = null;

    expect(() => getNavigateAction('/home', {})).toThrow(
      "Couldn't find a navigation object. Is your component inside NavigationContainer?"
    );

    (store.navigationRef as any).current = originalCurrent;
  });

  it('throws when store.linking is falsy', () => {
    const originalLinking = store.linking;
    Object.defineProperty(store, 'linking', { value: null, configurable: true });

    expect(() => getNavigateAction('/home', {})).toThrow(
      'Attempted to link to route when no routes are present'
    );

    Object.defineProperty(store, 'linking', { value: originalLinking, configurable: true });
  });

  it('returns undefined when applyRedirects returns undefined', () => {
    mockApplyRedirects.mockReturnValueOnce(undefined as any);

    const result = getNavigateAction('/redirect', {});

    expect(result).toBeUndefined();
  });

  it('logs error and returns undefined when getStateFromPath returns null', () => {
    (store.linking!.getStateFromPath as jest.Mock).mockReturnValueOnce(null);
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    const result = getNavigateAction('/bad-path', {});

    expect(result).toBeUndefined();
    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining('Could not generate a valid navigation state')
    );
    errorSpy.mockRestore();
  });

  it('logs error and returns undefined when getStateFromPath returns empty routes', () => {
    (store.linking!.getStateFromPath as jest.Mock).mockReturnValueOnce({ routes: [] });
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    const result = getNavigateAction('/bad-path', {});

    expect(result).toBeUndefined();
    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining('Could not generate a valid navigation state')
    );
    errorSpy.mockRestore();
  });

  it('returns action with type NAVIGATE by default', () => {
    const result = getNavigateAction('/home', {});

    expect(result).toEqual(
      expect.objectContaining({
        type: 'NAVIGATE',
        target: 'nav-key',
        payload: expect.objectContaining({
          name: 'home',
        }),
      })
    );
  });

  it('PUSH is downgraded to NAVIGATE when target navigator is not a stack', () => {
    mockFindDivergentState.mockReturnValue({
      actionState: { routes: [{ name: 'tab1' }] },
      navigationState: {
        key: 'tab-nav-key',
        type: 'tab',
        routes: [{ key: 'tab1-key', name: 'tab1' }],
        index: 0,
        routeNames: ['tab1'],
        stale: false,
      },
      actionStateRoute: { name: 'tab1' },
      navigationRoutes: [],
    });

    const result = getNavigateAction('/tab1', {}, 'PUSH');

    expect(result!.type).toBe('NAVIGATE');
  });

  it('type becomes JUMP_TO when target navigator is expo-tab', () => {
    mockFindDivergentState.mockReturnValue({
      actionState: { routes: [{ name: 'tab1' }] },
      navigationState: {
        key: 'expo-tab-key',
        type: 'expo-tab',
        routes: [{ key: 'tab1-key', name: 'tab1' }],
        index: 0,
        routeNames: ['tab1'],
        stale: false,
      },
      actionStateRoute: { name: 'tab1' },
      navigationRoutes: [],
    });

    const result = getNavigateAction('/tab1', {});

    expect(result!.type).toBe('JUMP_TO');
  });

  it('REPLACE becomes JUMP_TO when target navigator is drawer', () => {
    mockFindDivergentState.mockReturnValue({
      actionState: { routes: [{ name: 'screen1' }] },
      navigationState: {
        key: 'drawer-key',
        type: 'drawer',
        routes: [{ key: 'screen1-key', name: 'screen1' }],
        index: 0,
        routeNames: ['screen1'],
        stale: false,
      },
      actionStateRoute: { name: 'screen1' },
      navigationRoutes: [],
    });

    const result = getNavigateAction('/screen1', {}, 'REPLACE');

    expect(result!.type).toBe('JUMP_TO');
  });

  it('sets target to navigationState.key', () => {
    const result = getNavigateAction('/home', {});

    expect(result!.target).toBe('nav-key');
  });

  it('withAnchor sets initial: false on root and all nested params', () => {
    mockGetPayload.mockReturnValue({
      screen: 'home',
      params: {
        screen: 'nested',
        params: {
          screen: 'deep',
          params: {},
        },
      },
    });

    const result = getNavigateAction('/home', {}, 'NAVIGATE', true);

    // withAnchor=true → initial should be set to false at every level (inverted logic)
    const params = result!.payload.params as Record<string, any>;
    expect(params.initial).toBe(false);
    expect(params.params.initial).toBe(false);
    expect(params.params.params.initial).toBe(false);
  });

  it('isPreviewNavigation adds preview and no-animation params', () => {
    const isPreviewNavigation = true;
    const result = getNavigateAction(
      '/home',
      {},
      'NAVIGATE',
      false,
      undefined,
      isPreviewNavigation
    );

    expect(result!.payload.params).toEqual(
      expect.objectContaining({
        __internal__expo_router_is_preview_navigation: true,
        __internal_expo_router_no_animation: true,
      })
    );
  });

  it('passes singular option through to payload', () => {
    const singular = true;

    const result = getNavigateAction('/home', {}, 'NAVIGATE', false, singular);

    expect(result!.payload.singular).toBe(true);
  });

  it('PRELOAD uses lookThroughAllTabs=true on findDivergentState', () => {
    getNavigateAction('/home', {}, 'PRELOAD');

    expect(mockFindDivergentState).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      true // lookThroughAllTabs
    );
  });

  it('non-PRELOAD uses lookThroughAllTabs=false on findDivergentState', () => {
    getNavigateAction('/home', {}, 'NAVIGATE');

    expect(mockFindDivergentState).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      false
    );
  });

  it('REPLACE on stack navigator stays as REPLACE', () => {
    const result = getNavigateAction('/home', {}, 'REPLACE');

    expect(result!.type).toBe('REPLACE');
  });

  // `findDivergentState` can return `actionStateRoute: undefined` when the action state has
  // empty routes (edge case during navigation to an invalid path).
  it('returns action when actionStateRoute is undefined', () => {
    mockFindDivergentState.mockReturnValue({
      actionState: { routes: [] },
      navigationState: {
        key: 'nav-key',
        type: 'stack',
        routes: [{ key: 'root-key', name: '__root' }],
        index: 0,
        routeNames: ['__root'],
        stale: false,
      },
      actionStateRoute: undefined,
      navigationRoutes: [],
    });

    mockGetPayload.mockReturnValue({ screen: undefined, params: {} });

    const result = getNavigateAction('/home', {});

    expect(mockGetPayload).toHaveBeenCalledWith({});
    expect(result).toBeDefined();
  });

  it('PUSH uses lookThroughAllTabs=false on findDivergentState', () => {
    getNavigateAction('/home', {}, 'PUSH');

    expect(mockFindDivergentState).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      false
    );
  });

  it('REPLACE uses lookThroughAllTabs=false on findDivergentState', () => {
    getNavigateAction('/home', {}, 'REPLACE');

    expect(mockFindDivergentState).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      false
    );
  });
});
