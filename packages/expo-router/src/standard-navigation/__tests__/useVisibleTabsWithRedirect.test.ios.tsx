import { renderHook as renderHookWithoutProvider } from '@testing-library/react-native';
import { use, type PropsWithChildren } from 'react';

import { useRouteNode } from '../../Route';
import { node } from '../../global-state/__tests__/__fixtures__/routeNode';
import type { RoutingIntent } from '../../global-state/routingQueue';
import {
  PendingIntentsContext,
  RoutingQueueProvider,
} from '../../global-state/routingQueueContext';
import { useIsPreview } from '../../link/preview/PreviewRouteContext';
import { NavigatorStateContext } from '../../react-navigation/core/useNavigationState';
import { useIsFocused } from '../../react-navigation/native';
import { useVisibleTabsWithRedirect } from '../useVisibleTabsWithRedirect';

jest.mock('../../react-navigation/native', () => {
  const actualNavigation = jest.requireActual(
    '../../react-navigation/native'
  ) as typeof import('../../react-navigation/native');
  return { ...actualNavigation, useIsFocused: jest.fn() };
});
jest.mock('../../link/preview/PreviewRouteContext', () => ({
  useIsPreview: jest.fn(),
}));
jest.mock('../../Route', () => ({
  ...jest.requireActual('../../Route'),
  useRouteNode: jest.fn(),
}));

const mockedUseIsFocused = useIsFocused as jest.MockedFunction<typeof useIsFocused>;
const mockedUseRouteNode = useRouteNode as jest.MockedFunction<typeof useRouteNode>;
const mockedUseIsPreview = useIsPreview as jest.MockedFunction<typeof useIsPreview>;

const routes = [
  { key: 'home-key', name: 'home' },
  { key: 'settings-key', name: 'settings/index' },
  { key: 'hidden-key', name: 'hidden' },
  { key: 'filesystem-key', name: 'filesystem' },
];
const descriptors = {
  'home-key': { routeSource: 'layout' as const },
  'settings-key': { routeSource: 'layout' as const },
  'hidden-key': { routeSource: 'layout' as const, options: { hidden: true } },
  'filesystem-key': { routeSource: 'filesystem' as const },
};
const routeNames = routes.map((route) => route.name);

function routeNode(anchor: string) {
  return {
    ...node(
      '_layout',
      routes.map(({ name }) => node(name)),
      anchor
    ),
    contextKey: './_layout.js',
  };
}

let warnSpy: jest.SpyInstance;
let pendingIntents: RoutingIntent[];

function PendingIntentsProbe() {
  pendingIntents = use(PendingIntentsContext);
  return null;
}

function wrapper({ children }: PropsWithChildren) {
  return (
    <RoutingQueueProvider>
      <NavigatorStateContext.Provider
        value={{ stale: false, routeKeySeq: 0, key: 'tabs-key', index: 2, routeNames, routes }}>
        {children}
        <PendingIntentsProbe />
      </NavigatorStateContext.Provider>
    </RoutingQueueProvider>
  );
}

function renderHook<Result>(callback: () => Result) {
  return renderHookWithoutProvider(callback, { wrapper });
}

beforeEach(() => {
  pendingIntents = [];
  mockedUseIsPreview.mockReturnValue(false);
  mockedUseIsFocused.mockReturnValue(true);
  // Prevent route data from leaking between tests.
  mockedUseRouteNode.mockReturnValue(null);
  warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => {
  warnSpy.mockRestore();
});

describe('useVisibleTabsWithRedirect', () => {
  it('returns only visible layout routes and their focused index', async () => {
    const { result } = await renderHook(() =>
      useVisibleTabsWithRedirect({
        routes,
        routeNames,
        focusedRouteKey: 'settings-key',
        descriptors,
      })
    );

    expect(result.current.visibleRoutes).toEqual([routes[0], routes[1]]);
    expect(result.current.focusedIndex).toBe(1);
  });

  it('does not focus another tab when the focused route is not visible', async () => {
    const { result } = await renderHook(() =>
      useVisibleTabsWithRedirect({
        routes,
        routeNames,
        focusedRouteKey: 'hidden-key',
        descriptors,
      })
    );

    expect(result.current.focusedIndex).toBe(-1);
  });

  it('redirects an unavailable focused route to the configured visible route', async () => {
    mockedUseRouteNode.mockReturnValue(routeNode('settings'));
    await renderHook(() =>
      useVisibleTabsWithRedirect({
        routes,
        routeNames,
        focusedRouteKey: 'hidden-key',
        descriptors,
      })
    );

    expect(pendingIntents).toEqual([
      {
        type: 'ACTION',
        actionId: expect.any(Number),
        payload: {
          action: {
            type: 'REPLACE',
            payload: { name: 'settings/index', params: undefined },
            target: 'tabs-key',
          },
          originKey: 'tabs-key',
        },
      },
    ]);
  });

  it('keeps a focused filesystem +not-found route as fallback content', async () => {
    const notFoundRoute = { key: 'not-found-key', name: '+not-found' };
    const { result } = await renderHook(() =>
      useVisibleTabsWithRedirect({
        routes: [...routes, notFoundRoute],
        routeNames: [...routeNames, notFoundRoute.name],
        focusedRouteKey: notFoundRoute.key,
        descriptors: {
          ...descriptors,
          [notFoundRoute.key]: { routeSource: 'filesystem' as const },
        },
      })
    );

    expect(result.current.visibleRoutes).toEqual([routes[0], routes[1]]);
    expect(result.current.focusedFallbackRoute).toEqual(notFoundRoute);
    expect(pendingIntents).toEqual([]);
  });

  it('throws when the configured route is unavailable', async () => {
    mockedUseRouteNode.mockReturnValue(routeNode('missing'));
    await expect(
      async () =>
        await renderHook(() =>
          useVisibleTabsWithRedirect({
            routes,
            routeNames,
            focusedRouteKey: 'hidden-key',
            descriptors,
          })
        )
    ).rejects.toThrow(
      'The initial route name "missing" was not found in the layout at "./_layout.js". Available routes are: "home", "settings/index", "hidden", "filesystem". Set `unstable_settings.anchor` to the name of a route in this layout.'
    );
  });

  it('redirects when a navigator with no visible focused route becomes focused', async () => {
    mockedUseIsFocused.mockReturnValue(false);

    const { result, rerender } = await renderHook(() =>
      useVisibleTabsWithRedirect({
        routes,
        routeNames,
        focusedRouteKey: 'hidden-key',
        descriptors,
      })
    );

    expect(result.current.focusedIndex).toBe(-1);
    expect(pendingIntents).toEqual([]);

    mockedUseIsFocused.mockReturnValue(true);
    await rerender({});

    expect(pendingIntents).toEqual([
      {
        type: 'ACTION',
        actionId: expect.any(Number),
        payload: {
          action: {
            type: 'REPLACE',
            payload: { name: 'home', params: undefined },
            target: 'tabs-key',
          },
          originKey: 'tabs-key',
        },
      },
    ]);
  });

  it('does not redirect when the focused route is visible', async () => {
    await renderHook(() =>
      useVisibleTabsWithRedirect({
        routes,
        routeNames,
        focusedRouteKey: 'home-key',
        descriptors,
      })
    );

    expect(pendingIntents).toEqual([]);
  });

  it('does not redirect when there are no visible routes', async () => {
    mockedUseRouteNode.mockReturnValue({ contextKey: './app/_layout.tsx' } as ReturnType<
      typeof useRouteNode
    >);
    await renderHook(() =>
      useVisibleTabsWithRedirect({
        routes: [routes[3]!],
        routeNames: ['filesystem'],
        focusedRouteKey: 'filesystem-key',
        descriptors,
      })
    );

    expect(pendingIntents).toEqual([]);
    expect(warnSpy.mock.calls).toMatchSnapshot();
  });

  it('orders visible routes and redirect fallback by route names', async () => {
    const { result } = await renderHook(() =>
      useVisibleTabsWithRedirect({
        routes,
        routeNames: ['settings/index', 'home', 'hidden', 'filesystem'],
        focusedRouteKey: 'hidden-key',
        descriptors,
      })
    );

    expect(result.current.visibleRoutes).toEqual([routes[1], routes[0]]);
    expect(pendingIntents).toEqual([
      {
        type: 'ACTION',
        actionId: expect.any(Number),
        payload: {
          action: {
            type: 'REPLACE',
            payload: { name: 'settings/index', params: undefined },
            target: 'tabs-key',
          },
          originKey: 'tabs-key',
        },
      },
    ]);
  });

  it('does not redirect inside a link preview', async () => {
    mockedUseIsPreview.mockReturnValue(true);

    await renderHook(() =>
      useVisibleTabsWithRedirect({
        routes,
        routeNames,
        focusedRouteKey: 'hidden-key',
        descriptors,
      })
    );

    expect(pendingIntents).toEqual([]);
  });
});
