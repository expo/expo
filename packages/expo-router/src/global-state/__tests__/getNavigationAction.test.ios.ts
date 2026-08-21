import { applyRedirects } from '../../getRoutesRedirects';
import type { NavigationState } from '../../react-navigation/routers';
import { getNavigateAction } from '../getNavigationAction';
import { resolveNavigationDestination } from '../resolveNavigationDestination';
import { store } from '../store';

jest.mock('../store', () => ({
  store: {
    routeNode: { route: 'root', children: [] },
    linking: {
      getStateFromPath: jest.fn(() => ({ routes: [{ name: 'home' }] })),
      config: {},
    },
    redirects: [],
  },
}));

jest.mock('../resolveNavigationDestination', () => ({
  resolveNavigationDestination: jest.fn(({ action }) => ({
    ...action,
    target: 'root-nav',
    payload: { ...action.payload, name: 'home' },
  })),
}));

jest.mock('../../getRoutesRedirects', () => ({
  applyRedirects: jest.fn((href: string) => href),
}));

jest.mock('../../link/href', () => ({
  resolveHrefStringWithSegments: jest.fn((href: string) => href),
}));

const mockApplyRedirects = applyRedirects as jest.MockedFunction<typeof applyRedirects>;
const mockResolveNavigationDestination = resolveNavigationDestination as jest.MockedFunction<
  typeof resolveNavigationDestination
>;

const navigationState: NavigationState = {
  stale: false,
  routeKeySeq: 0,
  key: 'root-nav',
  index: 0,
  routeNames: ['__root'],
  routes: [{ key: 'root-route', name: '__root' }],
};

beforeEach(() => {
  jest.clearAllMocks();
  mockApplyRedirects.mockImplementation((href) => href);
  (store.linking!.getStateFromPath as jest.Mock).mockReturnValue({
    routes: [{ name: 'home' }],
  });
});

describe(getNavigateAction, () => {
  it('throws when routes are unavailable', () => {
    const routeNode = store.routeNode;
    Object.defineProperty(store, 'routeNode', {
      value: null,
      configurable: true,
    });

    expect(() =>
      getNavigateAction(
        '/home',
        {},
        new Map(),
        undefined,
        undefined,
        undefined,
        undefined,
        navigationState
      )
    ).toThrow('Attempted to link to route when no routes are present');

    Object.defineProperty(store, 'routeNode', {
      value: routeNode,
      configurable: true,
    });
  });

  it.each([null, { routes: [] }])('returns invalid for an unparseable path', (state) => {
    (store.linking!.getStateFromPath as jest.Mock).mockReturnValueOnce(state);

    expect(
      getNavigateAction(
        '/bad-path',
        {},
        new Map(),
        undefined,
        undefined,
        undefined,
        undefined,
        navigationState
      )
    ).toEqual({
      status: 'invalid',
      href: '/bad-path',
    });
  });

  it('returns the action built by the resolver', () => {
    const registry = new Map();

    const result = getNavigateAction(
      '/home',
      { event: 'PUSH' },
      registry,
      'PUSH',
      true,
      true,
      true,
      navigationState
    );

    expect(result).toEqual({
      status: 'action',
      action: expect.objectContaining({ type: 'PUSH', target: 'root-nav' }),
    });
    expect(mockResolveNavigationDestination).toHaveBeenCalledWith(
      expect.objectContaining({
        registry,
        navigationState,
        action: { type: 'PUSH', payload: { singular: true } },
        withAnchor: true,
        internalParams: {
          __internal__expo_router_is_preview_navigation: true,
          __internal_expo_router_no_animation: true,
        },
      })
    );
  });

  it('passes singular through to the resolver action', () => {
    getNavigateAction('/home', {}, new Map(), 'NAVIGATE', false, true, false, navigationState);

    expect(mockResolveNavigationDestination).toHaveBeenCalledWith(
      expect.objectContaining({
        action: { type: 'NAVIGATE', payload: { singular: true } },
      })
    );
  });
});
