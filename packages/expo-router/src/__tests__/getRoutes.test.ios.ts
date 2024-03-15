import { getRoutes } from '../getRoutes';
import { inMemoryContext } from '../testing-library/context-stubs';

const originalEnv = process.env.NODE_ENV;

afterEach(() => {
  process.env.NODE_ENV = originalEnv;
});

describe('getRoutes', () => {
  it(`should append a _layout, sitemap and +not-found`, () => {
    expect(
      getRoutes(
        inMemoryContext({
          './(app)/index': () => null,
        }),
        { internal_stripLoadRoute: true }
      )
    ).toEqual({
      children: [
        {
          type: 'route',
          children: [],
          contextKey: 'expo-router/build/views/Sitemap.js',
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
          type: 'route',
          children: [],
          contextKey: 'expo-router/build/views/Unmatched.js',
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
        {
          type: 'route',
          children: [],
          contextKey: './(app)/index.js',
          dynamic: null,
          entryPoints: ['expo-router/build/views/Navigator.js', './(app)/index.js'],
          route: '(app)/index',
        },
      ],
      contextKey: 'expo-router/build/views/Navigator.js',
      dynamic: null,
      generated: true,
      type: 'layout',
      route: '',
    });
  });

  it(`should not append a _layout if there already is a top level layout`, () => {
    expect(
      getRoutes(
        inMemoryContext({
          './(app)/index': () => null,
          './_layout': () => null,
        }),
        { internal_stripLoadRoute: true }
      )
    ).toEqual({
      children: [
        {
          type: 'route',
          children: [],
          contextKey: 'expo-router/build/views/Sitemap.js',
          dynamic: null,
          entryPoints: ['./_layout.js', 'expo-router/build/views/Sitemap.js'],
          generated: true,
          internal: true,
          route: '_sitemap',
        },
        {
          type: 'route',
          children: [],
          contextKey: 'expo-router/build/views/Unmatched.js',
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
        {
          type: 'route',
          children: [],
          contextKey: './(app)/index.js',
          dynamic: null,
          entryPoints: ['./_layout.js', './(app)/index.js'],
          route: '(app)/index',
        },
      ],
      contextKey: './_layout.js',
      dynamic: null,
      type: 'layout',
      route: '',
    });
  });

  it(`allows index routes be one level higher in the file-tree than their subroutes`, () => {
    expect(
      getRoutes(
        inMemoryContext({
          './[a].tsx': () => null, // In v2 this would error and require moving to ./[a]/index.tsx
          './[a]/[b].tsx': () => null, //
        }),
        { internal_stripLoadRoute: true, skipGenerated: true }
      )
    ).toEqual({
      children: [
        {
          children: [],
          contextKey: './[a].tsx',
          dynamic: [
            {
              deep: false,
              name: 'a',
            },
          ],
          entryPoints: ['expo-router/build/views/Navigator.js', './[a].tsx'],
          route: '[a]',
          type: 'route',
        },
        {
          children: [],
          contextKey: './[a]/[b].tsx',
          dynamic: [
            {
              deep: false,
              name: 'a',
            },
            {
              deep: false,
              name: 'b',
            },
          ],
          entryPoints: ['expo-router/build/views/Navigator.js', './[a]/[b].tsx'],
          route: '[a]/[b]',
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

  it(`will throw if a route ends in group syntax`, () => {
    expect(() => {
      getRoutes(
        inMemoryContext({
          './folder/(b).tsx': () => null,
        })
      );
    }).toThrowErrorMatchingInlineSnapshot(
      `"Invalid route ./folder/(b).tsx. Routes cannot end with '(group)' syntax"`
    );
  });

  it(`should name routes relative to the closest _layout`, () => {
    expect(
      getRoutes(
        inMemoryContext({
          './(b)/_layout': () => null,
          './(a,b)/page': () => null, // /(b)/page should have a different route name as it
        }),
        { internal_stripLoadRoute: true, skipGenerated: true }
      )
    ).toEqual({
      children: [
        {
          contextKey: './(b)/_layout.js',
          type: 'layout',
          dynamic: null,
          route: '(b)',
          children: [
            {
              type: 'route',
              contextKey: './(a,b)/page.js',
              dynamic: null,
              entryPoints: [
                'expo-router/build/views/Navigator.js',
                './(b)/_layout.js',
                './(a,b)/page.js',
              ],
              route: 'page',
              children: [],
            },
          ],
        },
        {
          type: 'route',
          contextKey: './(a,b)/page.js',
          dynamic: null,
          entryPoints: ['expo-router/build/views/Navigator.js', './(a,b)/page.js'],
          route: '(a)/page',
          children: [],
        },
      ],
      contextKey: 'expo-router/build/views/Navigator.js',
      type: 'layout',
      dynamic: null,
      generated: true,
      route: '',
    });
  });
});

describe('tutorial', () => {
  it(`will return null if there are no _layout or routes`, () => {
    expect(getRoutes(inMemoryContext({}))).toBeNull();
  });
});

describe('duplicate routes', () => {
  it(`throws if there are duplicate routes`, () => {
    expect(() => {
      getRoutes(
        inMemoryContext({
          'a.js': () => null,
          'a.tsx': () => null,
        })
      );
    }).toThrowErrorMatchingInlineSnapshot(
      `"The route files "./a.tsx" and "./a.js" conflict on the route "/a". Please remove or rename one of these files."`
    );
  });

  it(`doesn't throw if running in production`, () => {
    process.env.NODE_ENV = 'production';
    expect(() => {
      getRoutes(
        inMemoryContext({
          'a.js': () => null,
          'a.tsx': () => null,
        })
      );
    }).not.toThrow();
  });

  it(`will not throw if the routes are in separate groups`, () => {
    expect(() => {
      getRoutes(
        inMemoryContext({
          './(a)/c': () => null,
          './(b)/c': () => null,
        })
      );
    }).not.toThrow();
  });

  it(`throws if there are duplicate nested routes`, () => {
    expect(() => {
      getRoutes(
        inMemoryContext({
          'a.js': () => null,
          './test/folder/b.tsx': () => null,
          './test/folder/b.js': () => null,
        })
      );
    }).toThrowErrorMatchingInlineSnapshot(
      `"The route files "./test/folder/b.js" and "./test/folder/b.tsx" conflict on the route "/test/folder/b". Please remove or rename one of these files."`
    );
  });

  it(`doesn't throw if similarly named routes are in different groupings`, () => {
    expect(() => {
      getRoutes(
        inMemoryContext({
          './(a)/b.tsx': () => null,
          './(a,b)/b.tsx': () => null,
        })
      );
    }).toThrowErrorMatchingInlineSnapshot(
      `"The route files "./(a,b)/b.tsx" and "./(a)/b.tsx" conflict on the route "/(a)/b". Please remove or rename one of these files."`
    );
  });

  it(`will not throw of the groupings are present at different levels`, () => {
    expect(() => {
      getRoutes(
        inMemoryContext({
          './(a)/test/c': () => null,
          './test/(a)/c': () => null,
        })
      );
    }).not.toThrow();
  });
});

describe('+html', () => {
  it(`should ignore top-level +html files`, () => {
    expect(
      getRoutes(
        inMemoryContext({
          './+html': () => null,
        }),
        { internal_stripLoadRoute: true }
      )
    ).toEqual(null);
  });

  it(`errors if there are nested +html routes`, () => {
    expect(() => {
      getRoutes(
        inMemoryContext({
          './folder/+html': () => null,
        }),
        { internal_stripLoadRoute: true, skipGenerated: true }
      );
    }).toThrowErrorMatchingInlineSnapshot(
      `"Invalid route ./folder/+html.js. Route nodes cannot start with the '+' character. "Please rename to folder/html.js""`
    );
  });
});

describe('+not-found', () => {
  it(`should not append a +not-found if there already is a top level +not+found`, () => {
    expect(
      getRoutes(
        inMemoryContext({
          './(app)/index': () => null,
          './+not-found': () => null,
        }),
        { internal_stripLoadRoute: true }
      )
    ).toEqual({
      children: [
        {
          children: [],
          type: 'route',
          contextKey: './+not-found.js',
          dynamic: [
            {
              deep: true,
              name: '+not-found',
              notFound: true,
            },
          ],
          entryPoints: ['expo-router/build/views/Navigator.js', './+not-found.js'],
          route: '+not-found',
        },
        {
          children: [],
          type: 'route',
          contextKey: 'expo-router/build/views/Sitemap.js',
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
          type: 'route',
          contextKey: './(app)/index.js',
          dynamic: null,
          entryPoints: ['expo-router/build/views/Navigator.js', './(app)/index.js'],
          route: '(app)/index',
        },
      ],
      contextKey: 'expo-router/build/views/Navigator.js',
      type: 'layout',
      dynamic: null,
      generated: true,
      route: '',
    });
  });

  it(`should not match top-level deep dynamic with nested index`, () => {
    let routes = getRoutes(
      inMemoryContext({
        './(group)/+not-found/(group)/index.tsx': () => null,
        './+not-found/index.tsx': () => null,
        './+not-found/(group)/index.tsx': () => null,
        './(group1)/+not-found/(group2)/index.tsx': () => null,
        './(group1)/+not-found/(group2)/(group3)/index.tsx': () => null,
      }),
      { internal_stripLoadRoute: true }
    );

    expect(routes).not.toBeNull();
    routes = routes!;

    const notFound = routes.children.find((route) => route.route === '+not-found')!;

    // Ensure this is the generated +not-found
    expect(notFound.generated).toBeTruthy();
    expect(notFound.internal).toBeTruthy();
    expect(notFound.entryPoints).toContain('expo-router/build/views/Unmatched.js');
  });
});

describe('entry points', () => {
  it('should allow skipping entry point logic', () => {
    expect(
      getRoutes(
        inMemoryContext({
          './(app)/index': () => null,
        }),
        { internal_stripLoadRoute: true, ignoreEntryPoints: true }
      )
    ).toEqual({
      children: [
        {
          children: [],
          type: 'route',
          contextKey: 'expo-router/build/views/Sitemap.js',
          dynamic: null,
          generated: true,
          internal: true,
          route: '_sitemap',
        },
        {
          children: [],
          type: 'route',
          contextKey: 'expo-router/build/views/Unmatched.js',
          dynamic: [
            {
              deep: true,
              name: '+not-found',
              notFound: true,
            },
          ],
          generated: true,
          internal: true,
          route: '+not-found',
        },
        {
          children: [],
          type: 'route',
          contextKey: './(app)/index.js',
          dynamic: null,
          route: '(app)/index',
        },
      ],
      contextKey: 'expo-router/build/views/Navigator.js',
      type: 'layout',
      dynamic: null,
      generated: true,
      route: '',
    });
  });

  it(`should append entry points for all parent _layouts`, () => {
    expect(
      getRoutes(
        inMemoryContext({
          './a/_layout': () => null,
          './a/b/_layout': () => null,
          './a/b/(c,d)/_layout': () => null,
          './a/b/(c,d)/e': () => null,
        }),
        { internal_stripLoadRoute: true, skipGenerated: true }
      )
    ).toEqual({
      contextKey: 'expo-router/build/views/Navigator.js',
      type: 'layout',
      dynamic: null,
      generated: true,
      route: '',
      children: [
        {
          contextKey: './a/_layout.js',
          type: 'layout',
          dynamic: null,
          route: 'a',
          children: [
            {
              contextKey: './a/b/_layout.js',
              type: 'layout',
              dynamic: null,
              route: 'b',
              children: [
                {
                  contextKey: './a/b/(c,d)/_layout.js',
                  type: 'layout',
                  dynamic: null,
                  route: '(c)',
                  children: [
                    {
                      children: [],
                      type: 'route',
                      contextKey: './a/b/(c,d)/e.js',
                      dynamic: null,
                      entryPoints: [
                        'expo-router/build/views/Navigator.js',
                        './a/_layout.js',
                        './a/b/_layout.js',
                        './a/b/(c,d)/_layout.js',
                        './a/b/(c,d)/e.js',
                      ],
                      route: 'e',
                    },
                  ],
                },
                {
                  contextKey: './a/b/(c,d)/_layout.js',
                  type: 'layout',
                  dynamic: null,
                  route: '(d)',
                  children: [
                    {
                      children: [],
                      type: 'route',
                      contextKey: './a/b/(c,d)/e.js',
                      dynamic: null,
                      entryPoints: [
                        'expo-router/build/views/Navigator.js',
                        './a/_layout.js',
                        './a/b/_layout.js',
                        './a/b/(c,d)/_layout.js',
                        './a/b/(c,d)/e.js',
                      ],
                      route: 'e',
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    });
  });
});

describe('initialRouteName', () => {
  it(`should append entry points for all parent _layouts`, () => {
    expect(
      getRoutes(
        inMemoryContext({
          _layout: {
            unstable_settings: {
              initialRouteName: 'a',
            },
            default: () => null,
          },
          a: () => null,
          b: () => null,
        }),
        { skipGenerated: true }
      )
    ).toEqual({
      children: [
        {
          children: [],
          contextKey: './a.js',
          dynamic: null,
          entryPoints: ['./_layout.js', './a.js'],
          route: 'a',
          type: 'route',
          loadRoute: expect.any(Function),
        },
        {
          children: [],
          contextKey: './b.js',
          dynamic: null,
          entryPoints: ['./_layout.js', './a.js', './b.js'],
          route: 'b',
          type: 'route',
          loadRoute: expect.any(Function),
        },
      ],
      loadRoute: expect.any(Function),
      contextKey: './_layout.js',
      dynamic: null,
      initialRouteName: 'a',
      route: '',
      type: 'layout',
    });
  });

  it(`throws if initialRouteName does not match a route`, () => {
    expect(() => {
      getRoutes(
        inMemoryContext({
          _layout: {
            unstable_settings: {
              initialRouteName: 'c',
            },
            default: () => null,
          },
          a: () => null,
          b: () => null,
        })
      );
    }).toThrowErrorMatchingInlineSnapshot(
      `"Layout ./_layout.js has invalid initialRouteName 'c'. Valid options are: 'a', 'b'"`
    );
  });

  it(`throws if initialRouteName with group selection does not match a route`, () => {
    expect(() => {
      getRoutes(
        inMemoryContext({
          '(a,b)/_layout': {
            unstable_settings: {
              a: {
                initialRouteName: 'c',
              },
              b: {
                initialRouteName: 'd',
              },
            },
            default: () => null,
          },
          '(a,b)/c': () => null,
        })
      );
    }).toThrowErrorMatchingInlineSnapshot(
      `"Layout ./(a,b)/_layout.js has invalid initialRouteName 'd' for group '(b)'. Valid options are: 'c'"`
    );
  });
});

describe('dynamic routes', () => {
  it('parses dynamic routes', () => {
    expect(
      getRoutes(
        inMemoryContext({
          './[single]': () => null,
          './a/b/c/[single]': () => null,
          './[...catchAll]': () => null,
        }),
        { internal_stripLoadRoute: true, skipGenerated: true }
      )
    ).toEqual({
      children: [
        {
          children: [],
          type: 'route',
          contextKey: './[single].js',
          dynamic: [
            {
              deep: false,
              name: 'single',
            },
          ],
          entryPoints: ['expo-router/build/views/Navigator.js', './[single].js'],
          route: '[single]',
        },
        {
          children: [],
          type: 'route',
          contextKey: './[...catchAll].js',
          dynamic: [
            {
              deep: true,
              name: 'catchAll',
            },
          ],
          entryPoints: ['expo-router/build/views/Navigator.js', './[...catchAll].js'],
          route: '[...catchAll]',
        },
        {
          children: [],
          type: 'route',
          contextKey: './a/b/c/[single].js',
          dynamic: [
            {
              deep: false,
              name: 'single',
            },
          ],
          entryPoints: ['expo-router/build/views/Navigator.js', './a/b/c/[single].js'],
          route: 'a/b/c/[single]',
        },
      ],
      contextKey: 'expo-router/build/views/Navigator.js',
      type: 'layout',
      dynamic: null,
      generated: true,
      route: '',
    });
  });
});

describe('api routes', () => {
  it('should ignore api routes by default', () => {
    expect(
      getRoutes(
        inMemoryContext({
          './(app)/page': () => null,
          './(app)/page+api': () => null,
        }),
        { internal_stripLoadRoute: true, skipGenerated: true }
      )
    ).toEqual({
      children: [
        {
          type: 'route',
          children: [],
          contextKey: './(app)/page.js',
          dynamic: null,
          entryPoints: ['expo-router/build/views/Navigator.js', './(app)/page.js'],
          route: '(app)/page',
        },
      ],
      type: 'layout',
      contextKey: 'expo-router/build/views/Navigator.js',
      dynamic: null,
      generated: true,
      route: '',
    });
  });

  it('should include api routes is preserveApiRoutes is enabled', () => {
    expect(
      getRoutes(
        inMemoryContext({
          './(app)/page': () => null,
          './(app)/page+api': () => null,
        }),
        { internal_stripLoadRoute: true, skipGenerated: true, preserveApiRoutes: true }
      )
    ).toEqual({
      children: [
        {
          type: 'route',
          children: [],
          contextKey: './(app)/page.js',
          dynamic: null,
          entryPoints: ['expo-router/build/views/Navigator.js', './(app)/page.js'],
          route: '(app)/page',
        },
        {
          type: 'api',
          children: [],
          contextKey: './(app)/page+api.js',
          dynamic: null,
          route: '(app)/page',
        },
      ],
      type: 'layout',
      contextKey: 'expo-router/build/views/Navigator.js',
      dynamic: null,
      generated: true,
      route: '',
    });
  });
});

describe('group expansion', () => {
  it(`array syntax`, () => {
    expect(
      getRoutes(
        inMemoryContext({
          './(single)/directory/(a,b)/mixed': () => null,
        }),
        { internal_stripLoadRoute: true, skipGenerated: true }
      )
    ).toEqual({
      children: [
        {
          children: [],
          contextKey: './(single)/directory/(a,b)/mixed.js',
          dynamic: null,
          entryPoints: [
            'expo-router/build/views/Navigator.js',
            './(single)/directory/(a,b)/mixed.js',
          ],
          route: '(single)/directory/(a)/mixed',
          type: 'route',
        },
        {
          children: [],
          contextKey: './(single)/directory/(a,b)/mixed.js',
          dynamic: null,
          entryPoints: [
            'expo-router/build/views/Navigator.js',
            './(single)/directory/(a,b)/mixed.js',
          ],
          route: '(single)/directory/(b)/mixed',
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

  it(`multiple arrays`, () => {
    expect(
      getRoutes(
        inMemoryContext({
          './(a,b)/(c,d)/multiple-arrays': () => null,
        }),
        { internal_stripLoadRoute: true, skipGenerated: true }
      )
    ).toEqual({
      children: [
        {
          children: [],
          contextKey: './(a,b)/(c,d)/multiple-arrays.js',
          dynamic: null,
          entryPoints: ['expo-router/build/views/Navigator.js', './(a,b)/(c,d)/multiple-arrays.js'],
          route: '(a)/(c)/multiple-arrays',
          type: 'route',
        },
        {
          children: [],
          contextKey: './(a,b)/(c,d)/multiple-arrays.js',
          dynamic: null,
          entryPoints: ['expo-router/build/views/Navigator.js', './(a,b)/(c,d)/multiple-arrays.js'],
          route: '(a)/(d)/multiple-arrays',
          type: 'route',
        },
        {
          children: [],
          contextKey: './(a,b)/(c,d)/multiple-arrays.js',
          dynamic: null,
          entryPoints: ['expo-router/build/views/Navigator.js', './(a,b)/(c,d)/multiple-arrays.js'],
          route: '(b)/(c)/multiple-arrays',
          type: 'route',
        },
        {
          children: [],
          contextKey: './(a,b)/(c,d)/multiple-arrays.js',
          dynamic: null,
          entryPoints: ['expo-router/build/views/Navigator.js', './(a,b)/(c,d)/multiple-arrays.js'],
          route: '(b)/(d)/multiple-arrays',
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

  it(`multiple arrays with brackets`, () => {
    expect(
      getRoutes(
        inMemoryContext({
          './(a,b)/((c),d,(e))/multiple-arrays-with-brackets': () => null,
        }),
        { internal_stripLoadRoute: true, skipGenerated: true }
      )
    ).toEqual({
      children: [
        {
          children: [],
          contextKey: './(a,b)/((c),d,(e))/multiple-arrays-with-brackets.js',
          dynamic: null,
          entryPoints: [
            'expo-router/build/views/Navigator.js',
            './(a,b)/((c),d,(e))/multiple-arrays-with-brackets.js',
          ],
          route: '(a)/((c))/multiple-arrays-with-brackets',
          type: 'route',
        },
        {
          children: [],
          contextKey: './(a,b)/((c),d,(e))/multiple-arrays-with-brackets.js',
          dynamic: null,
          entryPoints: [
            'expo-router/build/views/Navigator.js',
            './(a,b)/((c),d,(e))/multiple-arrays-with-brackets.js',
          ],
          route: '(a)/(d)/multiple-arrays-with-brackets',
          type: 'route',
        },
        {
          children: [],
          contextKey: './(a,b)/((c),d,(e))/multiple-arrays-with-brackets.js',
          dynamic: null,
          entryPoints: [
            'expo-router/build/views/Navigator.js',
            './(a,b)/((c),d,(e))/multiple-arrays-with-brackets.js',
          ],
          route: '(a)/((e))/multiple-arrays-with-brackets',
          type: 'route',
        },
        {
          children: [],
          contextKey: './(a,b)/((c),d,(e))/multiple-arrays-with-brackets.js',
          dynamic: null,
          entryPoints: [
            'expo-router/build/views/Navigator.js',
            './(a,b)/((c),d,(e))/multiple-arrays-with-brackets.js',
          ],
          route: '(b)/((c))/multiple-arrays-with-brackets',
          type: 'route',
        },
        {
          children: [],
          contextKey: './(a,b)/((c),d,(e))/multiple-arrays-with-brackets.js',
          dynamic: null,
          entryPoints: [
            'expo-router/build/views/Navigator.js',
            './(a,b)/((c),d,(e))/multiple-arrays-with-brackets.js',
          ],
          route: '(b)/(d)/multiple-arrays-with-brackets',
          type: 'route',
        },
        {
          children: [],
          contextKey: './(a,b)/((c),d,(e))/multiple-arrays-with-brackets.js',
          dynamic: null,
          entryPoints: [
            'expo-router/build/views/Navigator.js',
            './(a,b)/((c),d,(e))/multiple-arrays-with-brackets.js',
          ],
          route: '(b)/((e))/multiple-arrays-with-brackets',
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
