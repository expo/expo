import { applyRedirects } from '../../getRoutesRedirects';
import type { NavigationState } from '../../react-navigation/routers';
import { getNavigateAction, type NavigateActionConfig } from '../getNavigationAction';
import { resolveNavigationDestination } from '../resolveNavigationDestination';

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
// The parser is generic, so Jest cannot infer its complete call signature from this fixture.
const getStateFromPath = jest.fn((_path: string) => ({
  routes: [{ name: 'home' }],
})) as jest.MockedFunction<NonNullable<NavigateActionConfig['linking']>['getStateFromPath']>;
const config: NavigateActionConfig = {
  registry: new Map(),
  routeNode: {
    type: 'route' as const,
    route: 'root',
    contextKey: 'root',
    children: [],
    dynamic: null,
    loadRoute: () => ({}),
  },
  linking: {
    getStateFromPath,
    config: { screens: {} },
  },
  redirects: [],
};

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
  getStateFromPath.mockReturnValue({ routes: [{ name: 'home' }] });
});

describe(getNavigateAction, () => {
  it('throws when routes are unavailable', () => {
    expect(() =>
      getNavigateAction(
        '/home',
        {},
        { ...config, routeNode: null },
        undefined,
        undefined,
        undefined,
        undefined,
        navigationState
      )
    ).toThrow('Attempted to link to route when no routes are present');
  });

  it('forwards configured redirects to applyRedirects', () => {
    const redirects = [
      [
        /^\/from$/,
        { source: '/from', destination: '/to', destinationContextKey: './to.tsx' },
        false,
      ],
    ] as typeof config.redirects;

    getNavigateAction(
      '/from',
      {},
      { ...config, redirects },
      undefined,
      undefined,
      undefined,
      undefined,
      navigationState
    );

    expect(mockApplyRedirects).toHaveBeenCalledWith('/from', redirects);
  });

  it('parses the href returned by applyRedirects', () => {
    mockApplyRedirects.mockReturnValueOnce('/redirected');

    getNavigateAction(
      '/from',
      {},
      config,
      undefined,
      undefined,
      undefined,
      undefined,
      navigationState
    );

    expect(getStateFromPath).toHaveBeenCalledWith('/redirected', { screens: {} }, []);
  });

  it.each([undefined, { routes: [] }])('returns invalid for an unparseable path', (state) => {
    getStateFromPath.mockReturnValueOnce(state);

    expect(
      getNavigateAction(
        '/bad-path',
        {},
        config,
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
      { ...config, registry },
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
});
