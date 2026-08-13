import { applyRedirects } from '../../getRoutesRedirects';
import { getStateFromPath } from '../../link/linking';
import type { SingularOptions } from '../../useScreens';
import {
  getNavigateAction as getNavigateActionImplementation,
  type NavigationActionContext,
} from '../getNavigationAction';
import { defaultRouteInfo } from '../getRouteInfoFromState';
import type { UrlObject } from '../getRouteInfoFromState';
import { resolveNavigationDestination } from '../resolveNavigationDestination';
import type { RouterRegistry } from '../routerRegistry';
import { store } from '../store';
import type { LinkToOptions } from '../types';

function getNavigateAction(
  baseHref: string,
  options: LinkToOptions,
  registry: RouterRegistry = new Map(),
  type = 'NAVIGATE',
  withAnchor?: boolean,
  singular?: SingularOptions,
  isPreviewNavigation?: boolean,
  routeInfo: Pick<UrlObject, 'segments' | 'params'> = defaultRouteInfo
) {
  return getNavigateActionImplementation(
    baseHref,
    options,
    registry,
    type,
    withAnchor,
    singular,
    isPreviewNavigation,
    routeInfo,
    {
      // The mocked ref includes `current` at runtime but its mocked type omits it.
      navigationRef: store.navigationRef as NavigationActionContext['navigationRef'],
      linking: store.linking,
      redirects: [],
    }
  );
}

jest.mock('../store', () => ({
  store: {
    navigationRef: {
      isReady: jest.fn(() => true),
      current: {
        getRootState: jest.fn(() => ({
          routes: [{ key: 'home-key', name: 'home' }],
          index: 0,
          key: 'root-nav',
          type: 'stack',
          routeNames: ['home'],
          stale: false,
        })),
      },
    },
    routeNode: { route: 'root', children: [] },
    linking: {
      config: {},
    },
    getRouteInfo: jest.fn(() => ({ pathname: '/', segments: [], params: {} })),
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

jest.mock('../../link/linking', () => ({
  getStateFromPath: jest.fn(),
}));

const mockApplyRedirects = applyRedirects as jest.MockedFunction<typeof applyRedirects>;
const mockGetStateFromPath = getStateFromPath as jest.MockedFunction<typeof getStateFromPath>;
const mockResolveNavigationDestination = resolveNavigationDestination as jest.MockedFunction<
  typeof resolveNavigationDestination
>;

beforeEach(() => {
  jest.clearAllMocks();
  mockApplyRedirects.mockImplementation((href) => href);
  // The module mock is narrower than `ExpoLinkingOptions` but supports the exercised parser.
  (store.linking as any).getStateFromPath = mockGetStateFromPath;
  mockGetStateFromPath.mockReturnValue({
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

    expect(() => getNavigateAction('/home', {}, new Map())).toThrow(
      'Attempted to link to route when no routes are present'
    );

    Object.defineProperty(store, 'routeNode', {
      value: routeNode,
      configurable: true,
    });
  });

  it.each([null, { routes: [] }])('returns invalid for an unparseable path', (state) => {
    mockGetStateFromPath.mockReturnValueOnce(state as any);

    expect(getNavigateAction('/bad-path', {}, new Map())).toEqual({
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
      true
    );

    expect(result).toEqual({
      status: 'action',
      action: expect.objectContaining({ type: 'PUSH', target: 'root-nav' }),
    });
    expect(mockResolveNavigationDestination).toHaveBeenCalledWith(
      expect.objectContaining({
        registry,
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
    getNavigateAction('/home', {}, new Map(), 'NAVIGATE', false, true);

    expect(mockResolveNavigationDestination).toHaveBeenCalledWith(
      expect.objectContaining({
        action: { type: 'NAVIGATE', payload: { singular: true } },
      })
    );
  });
});
