import { configFromFs } from '../mockState';

describe(configFromFs, () => {
  it(`matches`, () => {
    expect(
      configFromFs([
        '(foo)/_layout.tsx',
        '(foo)/bar/_layout.tsx',
        '(foo)/bar/[id].tsx',
        '(foo)/bar/[...rest].tsx',
      ])
    ).toEqual({
      initialRouteName: undefined,
      screens: {
        '(foo)': {
          initialRouteName: undefined,
          path: '(foo)',
          screens: {
            bar: {
              initialRouteName: undefined,
              path: 'bar',
              screens: { '[...rest]': '*rest', '[id]': ':id' },
            },
          },
        },
      },
    });
  });

  it(`adds initial route names`, () => {
    // Ensure we don't need to explicitly add the initial route name
    expect(
      configFromFs([
        '[...404].js',
        '(app)/_layout.tsx',
        '(app)/(explore)/_layout.tsx',
        '(app)/(explore)/[user]/index.tsx',
        '(app)/(explore)/explore.tsx',
      ])
    ).toEqual({
      initialRouteName: undefined,
      screens: {
        // Should match 404... maybe
        '[...404]': '*404',
        '(app)': {
          path: '(app)',
          initialRouteName: undefined,
          screens: {
            '(explore)': {
              path: '(explore)',
              screens: {
                '[user]/index': ':user',
                explore: 'explore',
              },
              initialRouteName: 'explore',
            },
          },
        },
      },
    });
  });

  it(`matches parallel`, () => {
    expect(
      configFromFs([
        '[...404].js',
        '(app)/_layout.tsx',
        [
          '(app)/(explore)/_layout.tsx',
          {
            unstable_settings: {
              initialRouteName: 'explore',
            },
          },
        ],
        '(app)/(explore)/[user]/index.tsx',
        '(app)/(explore)/explore.tsx',
        [
          '(app)/([user])/_layout.tsx',
          {
            unstable_settings: {
              initialRouteName: '[user]/index',
            },
          },
        ],
        '(app)/([user])/[user]/index.tsx',
        '(app)/([user])/explore.tsx',
      ])
    ).toEqual({
      initialRouteName: undefined,
      screens: {
        // Should match 404... maybe
        '[...404]': '*404',
        '(app)': {
          path: '(app)',
          initialRouteName: undefined,
          screens: {
            '(explore)': {
              path: '(explore)',
              screens: {
                '[user]/index': ':user',
                explore: 'explore',
              },
              initialRouteName: 'explore',
            },
            '([user])': {
              path: '([user])',
              screens: {
                '[user]/index': ':user',
                explore: 'explore',
              },
              initialRouteName: '[user]/index',
            },
          },
        },
      },
    });
  });
});
