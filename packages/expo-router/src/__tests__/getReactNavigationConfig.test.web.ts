import { getReactNavigationScreensConfig } from '../getReactNavigationConfig';

const mockRoutes = [
  {
    children: [
      {
        children: [],
        dynamic: null,
        route: 'people',
        contextKey: './(second-group)/people.tsx',
      },
    ],
    dynamic: null,
    route: '(second-group)',
    contextKey: './(second-group)/_layout.tsx',
  },
  {
    children: [
      {
        children: [],
        dynamic: [
          {
            name: 'deep',
            deep: true,
          },
        ],
        route: '[...deep]',
        contextKey: './(group)/[...deep].tsx',
      },
      {
        children: [],
        dynamic: [
          {
            name: 'dynamic',
            deep: false,
          },
        ],
        route: '[dynamic]',
        contextKey: './(group)/[dynamic].tsx',
      },
      {
        children: [],
        dynamic: null,
        route: 'index',
        contextKey: './(group)/index.tsx',
      },
    ],
    dynamic: null,
    route: '(group)',
    contextKey: './(group)/_layout.tsx',
  },
  {
    children: [],
    dynamic: [
      {
        name: 'screen',
        deep: true,
      },
    ],
    route: 'other/nested/[...screen]',
    contextKey: './other/nested/[...screen].js',
  },
  {
    children: [],
    dynamic: null,
    route: '_sitemap',
    contextKey: './_sitemap.tsx',
    generated: true,
    internal: true,
  },
];

describe(getReactNavigationScreensConfig, () => {
  it('should return a valid linking config', () => {
    expect(
      getReactNavigationScreensConfig(
        // @ts-expect-error
        mockRoutes,
        true
      )
    ).toEqual({
      '(group)': {
        initialRouteName: undefined,
        path: '(group)',
        screens: { '[...deep]': '*deep', '[dynamic]': ':dynamic', index: '' },
      },
      '(second-group)': {
        initialRouteName: undefined,
        path: '(second-group)',
        screens: { people: 'people' },
      },
      _sitemap: '_sitemap',
      'other/nested/[...screen]': 'other/nested/*screen',
    });
  });
  it('should return a valid linking config with route nodes', () => {
    expect(
      getReactNavigationScreensConfig(
        // @ts-expect-error
        mockRoutes,
        false
      )
    ).toEqual({
      '(group)': {
        initialRouteName: undefined,
        path: '(group)',
        _route: expect.anything(),
        screens: {
          '[...deep]': {
            path: '*deep',
            screens: {},
            _route: expect.anything(),
          },
          '[dynamic]': {
            path: ':dynamic',
            screens: {},
            _route: expect.anything(),
          },
          index: { path: '', screens: {}, _route: expect.anything() },
        },
      },
      '(second-group)': {
        initialRouteName: undefined,
        path: '(second-group)',
        _route: expect.anything(),
        screens: {
          people: { path: 'people', screens: {}, _route: expect.anything() },
        },
      },
      _sitemap: { path: '_sitemap', screens: {}, _route: expect.anything() },
      'other/nested/[...screen]': {
        path: 'other/nested/*screen',
        screens: {},
        _route: expect.anything(),
      },
    });
  });
});
