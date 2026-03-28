import { Platform } from 'react-native';

import { getRoutes } from '../getRoutes';
import { inMemoryContext } from '../testing-library/context-stubs';

// This test needs to run in a web environment, as it needs to follow the platform extensions for `ctx-web.tsx`

it(`should only load android and native routes`, () => {
  expect(
    getRoutes(
      inMemoryContext({
        './(app)/index': () => null,
        './(app)/page.ts': () => null,
        './(app)/page.web.ts': () => null,
        './(app)/page2.ts': () => null,
        './(app)/page2.native.ts': () => null,
        './(app)/page3.ts': () => null,
        './(app)/page3.android.ts': () => null,
        './(app)/page4.ts': () => null,
        './(app)/page4.ios.ts': () => null,
      }),
      { internal_stripLoadRoute: true, platform: Platform.OS, skipGenerated: true }
    )
  ).toEqual({
    children: [
      {
        children: [],
        contextKey: './(app)/index.js',
        dynamic: null,
        entryPoints: ['expo-router/build/views/Navigator.js', './(app)/index.js'],
        route: '(app)/index',
        type: 'route',
      },
      {
        children: [],
        contextKey: './(app)/page.ts',
        dynamic: null,
        entryPoints: ['expo-router/build/views/Navigator.js', './(app)/page.ts'],
        route: '(app)/page',
        type: 'route',
      },
      {
        children: [],
        contextKey: './(app)/page2.native.ts',
        dynamic: null,
        entryPoints: ['expo-router/build/views/Navigator.js', './(app)/page2.native.ts'],
        route: '(app)/page2',
        type: 'route',
      },
      {
        children: [],
        contextKey: './(app)/page3.android.ts',
        dynamic: null,
        entryPoints: ['expo-router/build/views/Navigator.js', './(app)/page3.android.ts'],
        route: '(app)/page3',
        type: 'route',
      },
      {
        children: [],
        contextKey: './(app)/page4.ts',
        dynamic: null,
        entryPoints: ['expo-router/build/views/Navigator.js', './(app)/page4.ts'],
        route: '(app)/page4',
        type: 'route',
      },
    ],
    contextKey: 'expo-router/build/views/Navigator.js',
    dynamic: null,
    generated: true,
    route: '',
    type: 'layout',
  });
});

it(`should work with layout routes`, () => {
  expect(
    getRoutes(
      inMemoryContext({
        './(app)/index.tsx': () => null,
        './(app)/_layout.tsx': () => null,
        './(app)/_layout.android.tsx': () => null,
      }),
      { internal_stripLoadRoute: true, platform: Platform.OS, skipGenerated: true }
    )
  ).toEqual({
    children: [
      {
        children: [
          {
            children: [],
            contextKey: './(app)/index.tsx',
            dynamic: null,
            entryPoints: [
              'expo-router/build/views/Navigator.js',
              './(app)/_layout.android.tsx',
              './(app)/index.tsx',
            ],
            route: 'index',
            type: 'route',
          },
        ],
        contextKey: './(app)/_layout.android.tsx',
        dynamic: null,
        initialRouteName: undefined,
        route: '(app)',
        type: 'layout',
      },
    ],
    contextKey: 'expo-router/build/views/Navigator.js',
    dynamic: null,
    generated: true,
    route: '',
    type: 'layout',
  });
});

describe(`platform extension fallbacks from different directories`, () => {
  it('allows a platform-specific route in a group without a sibling fallback', () => {
    expect(
      getRoutes(
        inMemoryContext({
          './login.tsx': () => null,
          './(tabs)/_layout.tsx': () => null,
          './(tabs)/login.native.tsx': () => null,
        }),
        { internal_stripLoadRoute: true, platform: Platform.OS, skipGenerated: true }
      )
    ).toEqual({
      children: [
        {
          children: [],
          contextKey: './login.tsx',
          dynamic: null,
          entryPoints: ['expo-router/build/views/Navigator.js', './login.tsx'],
          route: 'login',
          type: 'route',
        },
        {
          children: [
            {
              children: [],
              contextKey: './(tabs)/login.native.tsx',
              dynamic: null,
              entryPoints: [
                'expo-router/build/views/Navigator.js',
                './(tabs)/_layout.tsx',
                './(tabs)/login.native.tsx',
              ],
              route: 'login',
              type: 'route',
            },
          ],
          contextKey: './(tabs)/_layout.tsx',
          dynamic: null,
          initialRouteName: undefined,
          route: '(tabs)',
          type: 'layout',
        },
      ],
      contextKey: 'expo-router/build/views/Navigator.js',
      dynamic: null,
      generated: true,
      route: '',
      type: 'layout',
    });
  });

  it('allows a platform-only layout without a sibling fallback', () => {
    expect(
      getRoutes(
        inMemoryContext({
          './(tabs)/_layout.android.tsx': () => null,
          './(tabs)/home.tsx': () => null,
        }),
        { internal_stripLoadRoute: true, platform: Platform.OS, skipGenerated: true }
      )
    ).toEqual({
      children: [
        {
          children: [
            {
              children: [],
              contextKey: './(tabs)/home.tsx',
              dynamic: null,
              entryPoints: [
                'expo-router/build/views/Navigator.js',
                './(tabs)/_layout.android.tsx',
                './(tabs)/home.tsx',
              ],
              route: 'home',
              type: 'route',
            },
          ],
          contextKey: './(tabs)/_layout.android.tsx',
          dynamic: null,
          initialRouteName: undefined,
          route: '(tabs)',
          type: 'layout',
        },
      ],
      contextKey: 'expo-router/build/views/Navigator.js',
      dynamic: null,
      generated: true,
      route: '',
      type: 'layout',
    });
  });

  it('allows a platform-only page without a sibling fallback', () => {
    expect(
      getRoutes(
        inMemoryContext({
          './folder/page.android.tsx': () => null,
        }),
        { internal_stripLoadRoute: true, platform: Platform.OS, skipGenerated: true }
      )
    ).toEqual({
      children: [
        {
          children: [],
          contextKey: './folder/page.android.tsx',
          dynamic: null,
          entryPoints: ['expo-router/build/views/Navigator.js', './folder/page.android.tsx'],
          route: 'folder/page',
          type: 'route',
        },
      ],
      contextKey: 'expo-router/build/views/Navigator.js',
      dynamic: null,
      generated: true,
      route: '',
      type: 'layout',
    });
  });
});
