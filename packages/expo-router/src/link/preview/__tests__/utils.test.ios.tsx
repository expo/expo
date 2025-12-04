import type { NavigationState } from '@react-navigation/native/lib/typescript/src';

import { Stack } from '../../../layouts/Stack';
import { NativeTabs } from '../../../native-tabs/index';
import { renderRouter } from '../../../testing-library';
import { getPreloadedRouteFromRootStateByHref, getTabPathFromRootStateByHref } from '../utils';

// TODO: Remove this after the logs are removed from react-native-screens
let originalConsoleInfo: typeof console.info;
beforeAll(() => {
  originalConsoleInfo = console.info;
  console.info = (...args) => {
    const message = args[0];
    if (message && typeof message === 'string') {
      if (message.includes('TabsScreen') || message.includes('BottomTabs render')) {
        // Ignore logs from react-native-screens
        return;
      }
    }
    originalConsoleInfo(...args); // Call the original console.info
  };
});
afterAll(() => {
  console.info = originalConsoleInfo;
});

describe(getTabPathFromRootStateByHref, () => {
  beforeEach(() => {
    renderRouter({
      _layout: () => (
        <NativeTabs>
          <NativeTabs.Trigger name="index" />
          <NativeTabs.Trigger name="faces" />
          <NativeTabs.Trigger name="explore" />
        </NativeTabs>
      ),
      index: () => null,
      'faces/_layout': () => <Stack />,
      'faces/index': () => null,
      'faces/[face]': () => null,
      'explore/_layout': () => <Stack />,
      'explore/index': () => null,
      'explore/news/_layout': () => <Stack />,
      'explore/news/index': () => null,
      'explore/news/[title]': () => null,
    });
  });

  it('returns single tab path with one tab navigator in href, but without change', () => {
    const state = {
      stale: false,
      type: 'stack',
      key: 'stack-JffH1vhEyC5DchHoYg_-L',
      index: 0,
      routeNames: ['__root', '+not-found', '_sitemap'],
      routes: [
        {
          name: '__root',
          state: {
            stale: false,
            type: 'tab',
            key: 'tab-IBiK_OuEIIGFJ_YDRF760',
            index: 1,
            routeNames: ['index', 'faces', 'explore'],
            history: [
              {
                type: 'route',
                key: 'faces-BlzNnnAhZ7c9t5bfSf4kR',
              },
            ],
            routes: [
              {
                name: 'index',
                path: '/',
                key: 'index-Zv_CsLcfPO6mXyfEQG-n0',
              },
              {
                name: 'faces',
                key: 'faces-BlzNnnAhZ7c9t5bfSf4kR',
                state: {
                  stale: false,
                  type: 'stack',
                  key: 'stack-7sR1tGrlUaLv2LXn74x0d',
                  index: 0,
                  routeNames: ['index', '[face]'],
                  preloadedRoutes: [
                    {
                      key: '[face]-9rms2gdsibY9dVYUGCpZG',
                      name: '[face]',
                      params: {
                        face: '1e3a8a',
                      },
                    },
                  ],
                  routes: [
                    {
                      key: 'index-pmXH7A8Wnk3QyMNq1Gsvw',
                      name: 'index',
                    },
                  ],
                },
              },
              {
                name: 'explore',
                key: 'explore-zPybZdl_CGIZxtUVLaT2K',
              },
            ],
            preloadedRouteKeys: [],
          },
          key: '__root-fIzYvzoMkBMsXahmRCQXB',
        },
      ],
      preloadedRoutes: [],
    };
    const href = '/faces/1e3a8a';
    const tabPath = getTabPathFromRootStateByHref(href, state as NavigationState);
    expect(tabPath).toEqual([
      {
        oldTabKey: 'faces-BlzNnnAhZ7c9t5bfSf4kR',
        newTabKey: 'faces-BlzNnnAhZ7c9t5bfSf4kR',
      },
    ]);
  });

  it('returns single tab path with one tab navigator in href and with change', () => {
    const state = {
      stale: false,
      type: 'stack',
      key: 'stack-BwGGEF5WBtNuQP8AG6YUK',
      index: 0,
      routeNames: ['__root', '+not-found', '_sitemap'],
      routes: [
        {
          name: '__root',
          state: {
            stale: false,
            type: 'tab',
            key: 'tab-gFrqtQnDMQQ8qMMIptL6E',
            index: 0,
            routeNames: ['index', 'faces', 'explore'],
            history: [
              {
                type: 'route',
                key: 'index-rYeU6j6cRmkJK1pXpEFHs',
              },
            ],
            routes: [
              {
                name: 'index',
                path: '/',
                key: 'index-rYeU6j6cRmkJK1pXpEFHs',
              },
              {
                name: 'faces',
                key: 'faces-CtzasUGRC7VBM70ECYYD9',
                state: {
                  stale: false,
                  type: 'stack',
                  key: 'stack-0o3mKk6OKgAREN0rnNN9T',
                  index: 0,
                  routeNames: ['index', '[face]'],
                  preloadedRoutes: [
                    {
                      key: '[face]-MZ5nYkDCFxwNv1BcD5exf',
                      name: '[face]',
                      params: {
                        face: '1e3a8a',
                      },
                    },
                  ],
                  routes: [
                    {
                      key: 'index-E5BQcVJKhurHWYfmd4miV',
                      name: 'index',
                    },
                  ],
                },
              },
              {
                name: 'explore',
                key: 'explore-1rRkVf5WySMDWZdpYR5gY',
              },
            ],
            preloadedRouteKeys: [],
          },
          key: '__root-i4ih9bAW8jcq6MHWZNUhE',
        },
      ],
      preloadedRoutes: [],
    };
    const href = '/faces/1e3a8a';
    const tabPath = getTabPathFromRootStateByHref(href, state as NavigationState);
    expect(tabPath).toEqual([
      { oldTabKey: 'index-rYeU6j6cRmkJK1pXpEFHs', newTabKey: 'faces-CtzasUGRC7VBM70ECYYD9' },
    ]);
  });
});

describe(getPreloadedRouteFromRootStateByHref, () => {
  beforeEach(() => {
    renderRouter({
      _layout: () => (
        <NativeTabs>
          <NativeTabs.Trigger name="index" />
          <NativeTabs.Trigger name="faces" />
          <NativeTabs.Trigger name="explore" />
        </NativeTabs>
      ),
      index: () => null,
      'faces/_layout': () => <Stack />,
      'faces/index': () => null,
      'faces/[face]': () => null,
      'explore/_layout': () => <Stack />,
      'explore/index': () => null,
      'explore/news/_layout': () => <Stack />,
      'explore/news/index': () => null,
      'explore/news/[title]': () => null,
    });
  });

  it('returns correct preloaded route in the same stack', () => {
    const state = {
      stale: false,
      type: 'stack',
      key: 'stack-JffH1vhEyC5DchHoYg_-L',
      index: 0,
      routeNames: ['__root', '+not-found', '_sitemap'],
      routes: [
        {
          name: '__root',
          state: {
            stale: false,
            type: 'tab',
            key: 'tab-IBiK_OuEIIGFJ_YDRF760',
            index: 1,
            routeNames: ['index', 'faces', 'explore'],
            history: [
              {
                type: 'route',
                key: 'faces-BlzNnnAhZ7c9t5bfSf4kR',
              },
            ],
            routes: [
              {
                name: 'index',
                path: '/',
                key: 'index-Zv_CsLcfPO6mXyfEQG-n0',
              },
              {
                name: 'faces',
                key: 'faces-BlzNnnAhZ7c9t5bfSf4kR',
                state: {
                  stale: false,
                  type: 'stack',
                  key: 'stack-7sR1tGrlUaLv2LXn74x0d',
                  index: 0,
                  routeNames: ['index', '[face]'],
                  preloadedRoutes: [
                    {
                      key: '[face]-9rms2gdsibY9dVYUGCpZG',
                      name: '[face]',
                      params: {
                        face: '1e3a8a',
                      },
                    },
                  ],
                  routes: [
                    {
                      key: 'index-pmXH7A8Wnk3QyMNq1Gsvw',
                      name: 'index',
                    },
                  ],
                },
              },
              {
                name: 'explore',
                key: 'explore-zPybZdl_CGIZxtUVLaT2K',
              },
            ],
            preloadedRouteKeys: [],
          },
          key: '__root-fIzYvzoMkBMsXahmRCQXB',
        },
      ],
      preloadedRoutes: [],
    };
    const href = '/faces/1e3a8a';
    const preloadedRoute = getPreloadedRouteFromRootStateByHref(href, state as NavigationState);
    expect(preloadedRoute).toEqual({
      key: '[face]-9rms2gdsibY9dVYUGCpZG',
      name: '[face]',
      params: {
        face: '1e3a8a',
      },
    });
  });

  it('returns correct preloaded route in the different stack in different tab', () => {
    const state = {
      stale: false,
      type: 'stack',
      key: 'stack-BwGGEF5WBtNuQP8AG6YUK',
      index: 0,
      routeNames: ['__root', '+not-found', '_sitemap'],
      routes: [
        {
          name: '__root',
          state: {
            stale: false,
            type: 'tab',
            key: 'tab-gFrqtQnDMQQ8qMMIptL6E',
            index: 0,
            routeNames: ['index', 'faces', 'explore'],
            history: [
              {
                type: 'route',
                key: 'index-rYeU6j6cRmkJK1pXpEFHs',
              },
            ],
            routes: [
              {
                name: 'index',
                path: '/',
                key: 'index-rYeU6j6cRmkJK1pXpEFHs',
              },
              {
                name: 'faces',
                key: 'faces-CtzasUGRC7VBM70ECYYD9',
                state: {
                  stale: false,
                  type: 'stack',
                  key: 'stack-0o3mKk6OKgAREN0rnNN9T',
                  index: 0,
                  routeNames: ['index', '[face]'],
                  preloadedRoutes: [
                    {
                      key: '[face]-MZ5nYkDCFxwNv1BcD5exf',
                      name: '[face]',
                      params: {
                        face: '1e3a8a',
                      },
                    },
                  ],
                  routes: [
                    {
                      key: 'index-E5BQcVJKhurHWYfmd4miV',
                      name: 'index',
                    },
                  ],
                },
              },
              {
                name: 'explore',
                key: 'explore-1rRkVf5WySMDWZdpYR5gY',
              },
            ],
            preloadedRouteKeys: [],
          },
          key: '__root-i4ih9bAW8jcq6MHWZNUhE',
        },
      ],
      preloadedRoutes: [],
    };
    const href = '/faces/1e3a8a';
    const preloadedRoute = getPreloadedRouteFromRootStateByHref(href, state as NavigationState);
    expect(preloadedRoute).toEqual({
      key: '[face]-MZ5nYkDCFxwNv1BcD5exf',
      name: '[face]',
      params: {
        face: '1e3a8a',
      },
    });
  });
});
