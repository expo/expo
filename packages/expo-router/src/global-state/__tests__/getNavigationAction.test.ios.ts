import { applyRedirects } from '../../getRoutesRedirects';
import { getNavigateAction } from '../getNavigationAction';
import { findDivergentState, getNavigationPayloadFromStateRoute } from '../stateUtils';
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
  ...jest.requireActual('../stateUtils'),
  findDivergentState: jest.fn(),
  getNavigationPayloadFromStateRoute: jest.fn(),
}));

jest.mock('../../getRoutesRedirects', () => ({
  applyRedirects: jest.fn((href: string) => href),
}));

jest.mock('../../link/href', () => ({
  resolveHrefStringWithSegments: jest.fn((href: string) => href),
}));

const mockFindDivergentState = findDivergentState as jest.MockedFunction<typeof findDivergentState>;
const mockGetPayload = getNavigationPayloadFromStateRoute as jest.MockedFunction<
  typeof getNavigationPayloadFromStateRoute
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
      routes: [{ key: 'root-key', name: '__root' }],
      index: 0,
      routeNames: ['__root'],
      stale: false,
    },
    actionStateRoute: { name: 'home' },
    navigationRoutes: [],
  });

  mockGetPayload.mockReturnValue({
    name: 'home',
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

  it('NAVIGATE is emitted unchanged for tab-like target navigators', () => {
    mockFindDivergentState.mockReturnValue({
      actionState: { routes: [{ name: 'tab1' }] },
      navigationState: {
        key: 'expo-tab-key',
        routes: [{ key: 'tab1-key', name: 'tab1' }],
        index: 0,
        routeNames: ['tab1'],
        stale: false,
      },
      actionStateRoute: { name: 'tab1' },
      navigationRoutes: [],
    });

    const result = getNavigateAction('/tab1', {});

    expect(result!.type).toBe('NAVIGATE');
  });

  it('REPLACE is emitted unchanged regardless of target navigator kind', () => {
    mockFindDivergentState.mockReturnValue({
      actionState: { routes: [{ name: 'screen1' }] },
      navigationState: {
        key: 'drawer-key',
        routes: [{ key: 'screen1-key', name: 'screen1' }],
        index: 0,
        routeNames: ['screen1'],
        stale: false,
      },
      actionStateRoute: { name: 'screen1' },
      navigationRoutes: [],
    });

    const result = getNavigateAction('/screen1', {}, 'REPLACE');

    expect(result!.type).toBe('REPLACE');
  });

  it('sets target to navigationState.key', () => {
    const result = getNavigateAction('/home', {});

    expect(result!.target).toBe('nav-key');
  });

  // A plain `push` skips a nested navigator's `initialRouteName` anchor by collapsing the compiled
  // subtree to its focused path; `withAnchor` keeps the full subtree so the anchor loads. The
  // decision now lives entirely in `payload.state` — there is no legacy `initial` param.
  it('collapses the subtree to the focused path for a plain push', () => {
    mockGetPayload.mockReturnValue({
      name: 'root',
      params: {},
      state: {
        stale: false,
        key: '@:root:0',
        index: 1,
        routeNames: ['anchor', 'leaf'],
        routes: [
          { key: '@:root:0:anchor:0', name: 'anchor' },
          { key: '@:root:0:leaf:0', name: 'leaf' },
        ],
      },
    });

    const result = getNavigateAction('/root/leaf', {}, 'PUSH');

    expect(result!.payload.state).toEqual({
      stale: false,
      key: '@:root:0',
      index: 0,
      routeNames: ['anchor', 'leaf'],
      routes: [{ key: '@:root:0:leaf:0', name: 'leaf' }],
    });
    expect((result!.payload.params as Record<string, any>).initial).toBeUndefined();
  });

  it('withAnchor keeps the full anchored subtree on a push', () => {
    const anchored = {
      stale: false,
      key: '@:root:0',
      index: 1,
      routeNames: ['anchor', 'leaf'],
      routes: [
        { key: '@:root:0:anchor:0', name: 'anchor' },
        { key: '@:root:0:leaf:0', name: 'leaf' },
      ],
    };
    mockGetPayload.mockReturnValue({ name: 'root', params: {}, state: anchored });

    const result = getNavigateAction('/root/leaf', {}, 'PUSH', true);

    expect(result!.payload.state).toEqual(anchored);
  });

  // The preview/no-animation flags are threaded into the compiled subtree builder as extra params
  // (it propagates them to the focused leaf via rekeyState), not stitched onto the payload here.
  it('isPreviewNavigation threads preview and no-animation params into the subtree builder', () => {
    const isPreviewNavigation = true;
    getNavigateAction('/home', {}, 'NAVIGATE', false, undefined, isPreviewNavigation);

    expect(mockGetPayload).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      expect.objectContaining({
        __internal__expo_router_is_preview_navigation: true,
        __internal_expo_router_no_animation: true,
      }),
      true
    );
  });

  it('passes singular option through to payload', () => {
    const singular = true;

    const result = getNavigateAction('/home', {}, 'NAVIGATE', false, singular);

    expect(result!.payload.singular).toBe(true);
  });

  // Tab navigator keys are captured in React and threaded through the internal option so the
  // state-layer traversal can look through tabs. They are passed whenever present, regardless of
  // event type (simplest and harmless).
  it('threads tabNavigatorKeys from options into findDivergentState as a Set', () => {
    getNavigateAction('/home', { __internal__tabNavigatorKeys: ['tab-1', 'tab-2'] }, 'PRELOAD');

    expect(mockFindDivergentState).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      new Set(['tab-1', 'tab-2']),
      undefined
    );
  });

  it('passes undefined tabNavigatorKeys when the option is absent', () => {
    getNavigateAction('/home', {}, 'PRELOAD');

    expect(mockFindDivergentState).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      undefined,
      undefined
    );
  });

  it('threads tabNavigatorKeys for non-PRELOAD events too', () => {
    getNavigateAction('/home', { __internal__tabNavigatorKeys: ['tab-1'] }, 'NAVIGATE');

    expect(mockFindDivergentState).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      new Set(['tab-1']),
      undefined
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
        routes: [{ key: 'root-key', name: '__root' }],
        index: 0,
        routeNames: ['__root'],
        stale: false,
      },
      actionStateRoute: undefined,
      navigationRoutes: [],
    });

    mockGetPayload.mockReturnValue({ name: undefined, params: {} });

    const result = getNavigateAction('/home', {});

    // Fourth arg is the reuse-existing-route flag (`true` for a NAVIGATE, `false` for a PUSH).
    expect(mockGetPayload).toHaveBeenCalledWith({}, expect.anything(), {}, true);
    expect(result).toBeDefined();
  });

  // A nested target is emitted purely as `payload.state` (the compiled subtree). The action's own
  // `name`/`params` describe only the divergent route; there is no legacy nested screen/params chain.
  it('emits a nested target as payload.state with no legacy screen/params chain', () => {
    mockGetPayload.mockReturnValue({
      name: 'root',
      params: { id: '123' },
      state: {
        stale: false,
        key: '@:root:0',
        index: 0,
        routeNames: ['leaf'],
        routes: [{ key: '@:root:0:leaf:0', name: 'leaf' }],
      },
    });

    const result = getNavigateAction('/root/leaf?id=123', {});

    expect(result!.payload.name).toBe('root');
    expect(result!.payload.params).toEqual({ id: '123' });
    expect((result!.payload.params as Record<string, any>).screen).toBeUndefined();
    expect(result!.payload.state).toEqual({
      stale: false,
      key: '@:root:0',
      index: 0,
      routeNames: ['leaf'],
      routes: [{ key: '@:root:0:leaf:0', name: 'leaf' }],
    });
  });
});
