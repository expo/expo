import { getRoutes } from '../getRoutes';
import { inMemoryContext } from '../testing-library/context-stubs';

// This test needs to run in a node environment, as it needs to follow the platform extensions for `ctx.tsx`

it(`should load tv and native routes for tv platform`, () => {
  expect(
    getRoutes(
      inMemoryContext({
        './(app)/index': () => null,
        './(app)/page.ts': () => null,
        './(app)/page.web.ts': () => null,
        './(app)/page2.ts': () => null,
        './(app)/page2.native.ts': () => null,
        './(app)/page3.ts': () => null,
        './(app)/page3.tv.ts': () => null,
        './(app)/page4.ts': () => null,
        './(app)/page4.ios.ts': () => null,
      }),
      { internal_stripLoadRoute: true, platform: 'tv', skipGenerated: true }
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
        contextKey: './(app)/page3.tv.ts',
        dynamic: null,
        entryPoints: ['expo-router/build/views/Navigator.js', './(app)/page3.tv.ts'],
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

it(`should work with tv layout routes`, () => {
  expect(
    getRoutes(
      inMemoryContext({
        './(app)/index.tsx': () => null,
        './(app)/_layout.tsx': () => null,
        './(app)/_layout.tv.tsx': () => null,
      }),
      { internal_stripLoadRoute: true, platform: 'tv', skipGenerated: true }
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
              './(app)/_layout.tv.tsx',
              './(app)/index.tsx',
            ],
            route: 'index',
            type: 'route',
          },
        ],
        contextKey: './(app)/_layout.tv.tsx',
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
