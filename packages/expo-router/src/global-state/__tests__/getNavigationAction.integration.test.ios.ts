import { applyRedirects } from '../../getRoutesRedirects';
import { resolveHrefStringWithSegments } from '../../link/href';
import { getNavigateAction } from '../getNavigationAction';
import { getRouteInfoFromState } from '../getRouteInfoFromState';
import { store } from '../store';

jest.mock('../store', () => ({
  store: {
    assertIsReady: jest.fn(),
    navigationRef: {
      current: {
        // A production-shaped committed tree: the root always focuses the `__root` slot, whose child
        // navigator holds the app routes. Relative-href resolution now derives its base from this
        // committed state, so it must be `__root`-rooted like the real thing.
        getRootState: jest.fn(() => ({
          key: '@',
          index: 0,
          routeNames: ['__root'],
          stale: false,
          routes: [
            {
              key: '@:__root:0',
              name: '__root',
              state: {
                key: '@:__root:0',
                index: 0,
                routeNames: ['bar'],
                stale: false,
                routes: [{ key: '@:__root:0:bar:0', name: 'bar' }],
              },
            },
          ],
        })),
      },
    },
    linking: {
      getStateFromPath: jest.fn(() => ({
        key: '@',
        index: 0,
        routeNames: ['__root'],
        stale: false,
        routes: [
          {
            key: '@:__root:0',
            name: '__root',
            state: {
              key: '@:__root:0',
              index: 0,
              routeNames: ['bar'],
              stale: false,
              routes: [
                {
                  key: '@:__root:0:bar:0',
                  name: 'bar',
                  params: { id: '123' },
                  state: {
                    key: '@:__root:0:bar:0',
                    index: 0,
                    routeNames: ['leaf'],
                    routes: [{ key: '@:__root:0:bar:0:leaf:0', name: 'leaf' }],
                    stale: false,
                  },
                },
              ],
            },
          },
        ],
      })),
      config: {},
    },
    getRouteInfo: jest.fn(() => ({ pathname: '/', segments: [], params: {} })),
    redirects: [],
  },
}));

jest.mock('../../getRoutesRedirects', () => ({
  applyRedirects: jest.fn((href: string) => href),
}));

jest.mock('../../link/href', () => ({
  resolveHrefStringWithSegments: jest.fn((href: string) => href),
}));

const mockApplyRedirects = applyRedirects as jest.MockedFunction<typeof applyRedirects>;

beforeEach(() => {
  jest.clearAllMocks();
  mockApplyRedirects.mockImplementation((href) => href);
});

it('emits a live-keyed payload.state with no legacy nested params wire', () => {
  const result = getNavigateAction('/bar/leaf?id=123', {}, 'PUSH', false, undefined, true);

  expect(result).toEqual({
    type: 'PUSH',
    target: '@:__root:0',
    payload: {
      // The action describes only the divergent route; its own params carry the preview flags.
      name: 'bar',
      params: {
        id: '123',
        __internal__expo_router_is_preview_navigation: true,
        __internal_expo_router_no_animation: true,
      },
      singular: undefined,
      // The nested target is carried entirely here, live-keyed, with the flags propagated to the leaf.
      state: {
        key: '@:__root:0:bar:1',
        index: 0,
        routeNames: ['leaf'],
        routes: [
          {
            key: '@:__root:0:bar:1:leaf:0',
            name: 'leaf',
            params: {
              id: '123',
              __internal__expo_router_is_preview_navigation: true,
              __internal_expo_router_no_animation: true,
            },
          },
        ],
        stale: false,
      },
    },
  });
  expect(store.linking!.getStateFromPath).toHaveBeenCalledWith('/bar/leaf?id=123', {});
});

it('resolves relative segments against the freshly committed root state, not a stale store.getRouteInfo()', () => {
  // Simulate the staleness window: `store.getRouteInfo()` still reports an old location while
  // `getRootState()` already reflects the latest commit. Relative resolution must use the fresh one.
  (store.getRouteInfo as jest.Mock).mockReturnValue({
    pathname: '/stale',
    segments: ['stale'],
    params: {},
  });

  getNavigateAction('./sibling', {}, 'NAVIGATE');

  const rootState = store.navigationRef.current!.getRootState();
  const routeInfoArg = (resolveHrefStringWithSegments as jest.Mock).mock.calls[0]![1];

  // The base handed to relative resolution is derived from the committed root state, not the stale
  // mirror — so it never picks up the '/stale' location.
  expect(routeInfoArg).toEqual(getRouteInfoFromState(rootState as any));
  expect(routeInfoArg.segments).not.toEqual(['stale']);
});
