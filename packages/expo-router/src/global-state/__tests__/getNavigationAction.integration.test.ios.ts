import { applyRedirects } from '../../getRoutesRedirects';
import { getNavigateAction } from '../getNavigationAction';
import { store } from '../store';

jest.mock('../store', () => ({
  store: {
    assertIsReady: jest.fn(),
    navigationRef: {
      current: {
        getRootState: jest.fn(() => ({
          key: '@',
          index: 0,
          routeNames: ['bar'],
          routes: [{ key: '@:bar:0', name: 'bar' }],
          stale: false,
        })),
      },
    },
    linking: {
      getStateFromPath: jest.fn(() => ({
        key: '@',
        index: 0,
        routeNames: ['bar'],
        routes: [
          {
            key: '@:bar:0',
            name: 'bar',
            params: { id: '123' },
            state: {
              key: '@:bar:0',
              index: 0,
              routeNames: ['leaf'],
              routes: [{ key: '@:bar:0:leaf:0', name: 'leaf' }],
              stale: false,
            },
          },
        ],
        stale: false,
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
    target: '@',
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
        key: '@:bar:1',
        index: 0,
        routeNames: ['leaf'],
        routes: [
          {
            key: '@:bar:1:leaf:0',
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
