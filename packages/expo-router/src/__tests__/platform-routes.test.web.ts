import { Platform } from 'react-native';

import { getRoutes } from '../getRoutes';
import { inMemoryContext } from '../testing-library/context-stubs';

// This test needs to run in a web environment, as it needs to follow the platform extensions for `ctx-web.tsx`

it(`should only load web routes`, () => {
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
        contextKey: './(app)/page.web.ts',
        dynamic: null,
        entryPoints: ['expo-router/build/views/Navigator.js', './(app)/page.web.ts'],
        route: '(app)/page',
        type: 'route',
      },
      {
        children: [],
        contextKey: './(app)/page2.ts',
        dynamic: null,
        entryPoints: ['expo-router/build/views/Navigator.js', './(app)/page2.ts'],
        route: '(app)/page2',
        type: 'route',
      },
      {
        children: [],
        contextKey: './(app)/page3.ts',
        dynamic: null,
        entryPoints: ['expo-router/build/views/Navigator.js', './(app)/page3.ts'],
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

it(`should skip platform routes when no platform has been provided`, () => {
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
      { internal_stripLoadRoute: true, platform: undefined, skipGenerated: true }
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
        contextKey: './(app)/page2.ts',
        dynamic: null,
        entryPoints: ['expo-router/build/views/Navigator.js', './(app)/page2.ts'],
        route: '(app)/page2',
        type: 'route',
      },
      {
        children: [],
        contextKey: './(app)/page3.ts',
        dynamic: null,
        entryPoints: ['expo-router/build/views/Navigator.js', './(app)/page3.ts'],
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

describe(`platform-only routes without a non-platform fallback`, () => {
  it('layouts', () => {
    expect(
      getRoutes(
        inMemoryContext({
          './folder/_layout.web.tsx': () => null,
          './folder/page.tsx': () => null,
        }),
        { internal_stripLoadRoute: true, platform: Platform.OS, skipGenerated: true }
      )
    ).toEqual({
      children: [
        {
          children: [
            {
              children: [],
              contextKey: './folder/page.tsx',
              dynamic: null,
              entryPoints: [
                'expo-router/build/views/Navigator.js',
                './folder/_layout.web.tsx',
                './folder/page.tsx',
              ],
              route: 'page',
              type: 'route',
            },
          ],
          contextKey: './folder/_layout.web.tsx',
          dynamic: null,
          initialRouteName: undefined,
          route: 'folder',
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

  it('pages', () => {
    expect(
      getRoutes(
        inMemoryContext({
          './folder/page.web.tsx': () => null,
        }),
        { internal_stripLoadRoute: true, platform: Platform.OS, skipGenerated: true }
      )
    ).toEqual({
      children: [
        {
          children: [],
          contextKey: './folder/page.web.tsx',
          dynamic: null,
          entryPoints: ['expo-router/build/views/Navigator.js', './folder/page.web.tsx'],
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

describe(`platform extension fallbacks from different directories`, () => {
  it('allows a platform-specific route in a group without a sibling fallback', () => {
    expect(
      getRoutes(
        inMemoryContext({
          './login.tsx': () => null,
          './(tabs)/_layout.tsx': () => null,
          './(tabs)/login.web.tsx': () => null,
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
              contextKey: './(tabs)/login.web.tsx',
              dynamic: null,
              entryPoints: [
                'expo-router/build/views/Navigator.js',
                './(tabs)/_layout.tsx',
                './(tabs)/login.web.tsx',
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
});

it(`can display platform routes`, () => {
  expect(
    getRoutes(
      inMemoryContext({
        './(app)/index': () => null,
        './(app)/page.ts': () => null,
        './(app)/page.web.ts': () => null,
      }),
      {
        internal_stripLoadRoute: true,
        platform: Platform.OS,
        skipGenerated: true,
        platformRoutes: false,
      }
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
        './(app)/_layout.web.tsx': () => null,
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
              './(app)/_layout.web.tsx',
              './(app)/index.tsx',
            ],
            route: 'index',
            type: 'route',
          },
        ],
        contextKey: './(app)/_layout.web.tsx',
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
