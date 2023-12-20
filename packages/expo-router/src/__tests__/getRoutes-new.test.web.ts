import { getRoutes } from '../global-state/getRoutes';
import { getMockContext } from '../testing-library';

it('skips +html files', () => {
  const context = getMockContext({
    _layout: () => null,
    '+html': () => null,
    one: () => null,
  });

  expect(getRoutes(context, { unstable_stripLoadRoute: true })).toEqual({
    children: [
      {
        children: [],
        contextKey: './one.js',
        dynamic: null,
        entryPoints: ['./_layout.js', './one.js'],
        route: 'one',
      },
      {
        children: [],
        contextKey: './_sitemap.tsx',
        dynamic: null,
        entryPoints: ['./_layout.js', 'expo-router/build/views/Sitemap.js'],
        generated: true,
        internal: true,
        route: '_sitemap',
      },
      {
        children: [],
        contextKey: './+not-found.tsx',
        dynamic: [
          {
            deep: true,
            name: '+not-found',
            notFound: true,
          },
        ],
        entryPoints: ['./_layout.js', 'expo-router/build/views/Unmatched.js'],
        generated: true,
        internal: true,
        route: '+not-found',
      },
    ],
    contextKey: './_layout.js',
    dynamic: null,
    route: '',
  });
});

describe('platform extensions', () => {
  it('supports route platform extensions', () => {
    const context = getMockContext({
      one: () => null,
      'one.web': () => null,
      'one.ios': () => null,
      'one.native': () => null,
    });

    expect(
      getRoutes(context, { unstable_stripLoadRoute: true, unstable_platformExtensions: true })
    ).toEqual({
      children: [
        {
          children: [],
          contextKey: './one.web.js',
          dynamic: null,
          entryPoints: ['expo-router/build/views/Navigator.js', './one.web.js'],
          route: 'one',
        },
        {
          children: [],
          contextKey: './_sitemap.tsx',
          dynamic: null,
          entryPoints: [
            'expo-router/build/views/Navigator.js',
            'expo-router/build/views/Sitemap.js',
          ],
          generated: true,
          internal: true,
          route: '_sitemap',
        },
        {
          children: [],
          contextKey: './+not-found.tsx',
          dynamic: [
            {
              deep: true,
              name: '+not-found',
              notFound: true,
            },
          ],
          entryPoints: [
            'expo-router/build/views/Navigator.js',
            'expo-router/build/views/Unmatched.js',
          ],
          generated: true,
          internal: true,
          route: '+not-found',
        },
      ],
      contextKey: './_layout.tsx',
      dynamic: null,
      generated: true,
      route: '',
    });
  });

  it('supports _layout platform extensions', () => {
    const context = getMockContext({
      one: () => null,
      _layout: () => null,
      '_layout.web': () => null,
    });

    expect(
      getRoutes(context, { unstable_stripLoadRoute: true, unstable_platformExtensions: true })
    ).toEqual({
      children: [
        {
          children: [],
          contextKey: './one.js',
          dynamic: null,
          entryPoints: ['./_layout.web.js', './one.js'],
          route: 'one',
        },
        {
          children: [],
          contextKey: './_sitemap.tsx',
          dynamic: null,
          entryPoints: ['./_layout.web.js', 'expo-router/build/views/Sitemap.js'],
          generated: true,
          internal: true,
          route: '_sitemap',
        },
        {
          children: [],
          contextKey: './+not-found.tsx',
          dynamic: [
            {
              deep: true,
              name: '+not-found',
              notFound: true,
            },
          ],
          entryPoints: ['./_layout.web.js', 'expo-router/build/views/Unmatched.js'],
          generated: true,
          internal: true,
          route: '+not-found',
        },
      ],
      contextKey: './_layout.web.js',
      dynamic: null,
      route: '_layout',
    });
  });
});
