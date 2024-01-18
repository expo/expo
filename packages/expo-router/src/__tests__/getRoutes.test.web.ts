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
        {
          children: [],
          contextKey: './(app)/index.js',
          dynamic: null,
          entryPoints: ['expo-router/build/views/Navigator.js', './(app)/index.js'],
          route: '(app)/index',
        },
      ],
      contextKey: './_layout.tsx',
      dynamic: null,
      generated: true,
      route: '',
    });
  });

  it(`should ensure grouped routes expanded to all possible routes`, () => {
    expect(
      getRoutes(
        inMemoryContext({
          './(a,b)/(c,d)/page': () => null,
        }),
        { internal_stripLoadRoute: true, internal_skipGenerated: true }
      )
    ).toEqual({
      children: [
        {
          contextKey: './(a,b)/(c,d)/page.js',
          dynamic: null,
          entryPoints: ['expo-router/build/views/Navigator.js', './(a,b)/(c,d)/page.js'],
          route: '(a)/(c)/page',
          children: [],
        },
        {
          contextKey: './(a,b)/(c,d)/page.js',
          dynamic: null,
          entryPoints: ['expo-router/build/views/Navigator.js', './(a,b)/(c,d)/page.js'],
          route: '(a)/(d)/page',
          children: [],
        },
        {
          contextKey: './(a,b)/(c,d)/page.js',
          dynamic: null,
          entryPoints: ['expo-router/build/views/Navigator.js', './(a,b)/(c,d)/page.js'],
          route: '(b)/(c)/page',
          children: [],
        },
        {
          contextKey: './(a,b)/(c,d)/page.js',
          dynamic: null,
          entryPoints: ['expo-router/build/views/Navigator.js', './(a,b)/(c,d)/page.js'],
          route: '(b)/(d)/page',
          children: [],
        },
      ],
      contextKey: './_layout.tsx',
      dynamic: null,
      generated: true,
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
        {
          children: [],
          contextKey: './(app)/index.js',
          dynamic: null,
          entryPoints: ['./_layout.js', './(app)/index.js'],
          route: '(app)/index',
        },
      ],
      contextKey: './_layout.js',
      dynamic: null,
      route: '',
    });
  });

  it(`will throw if a route ends in group syntax`, () => {
    expect(() => {
      getRoutes(
        inMemoryContext({
          './(a)/(b).tsx': () => null,
        })
      );
    }).toThrowErrorMatchingInlineSnapshot(
      `"Invalid route ./(a)/(b).tsx. Routes cannot end with '(group)' syntax"`
    );
  });

  it(`should name routes relative to the closest _layout`, () => {
    expect(
      getRoutes(
        inMemoryContext({
          './(b)/_layout': () => null,
          './(a,b)/page': () => null, // /(b)/page should have a different route name as it
        }),
        { internal_stripLoadRoute: true, internal_skipGenerated: true }
      )
    ).toEqual({
      children: [
        {
          contextKey: './(b)/_layout.js',
          dynamic: null,
          route: '(b)',
          children: [
            {
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
          contextKey: './(a,b)/page.js',
          dynamic: null,
          entryPoints: ['expo-router/build/views/Navigator.js', './(a,b)/page.js'],
          route: '(a)/page',
          children: [],
        },
      ],
      contextKey: './_layout.tsx',
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
      `"The route files "./a.tsx" and ./a.js conflict on the route "/a". Please remove or rename one of these files."`
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
      `"The route files "./test/folder/b.js" and ./test/folder/b.tsx conflict on the route "/test/folder/b". Please remove or rename one of these files."`
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
      `"The route files "./(a,b)/b.tsx" and ./(a)/b.tsx conflict on the route "/(a)/b". Please remove or rename one of these files."`
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

  it(`allows nested +html routes`, () => {
    expect(
      getRoutes(
        inMemoryContext({
          './folder/+html': () => null,
        }),
        { internal_stripLoadRoute: true, internal_skipGenerated: true }
      )
    ).toEqual({
      children: [
        {
          children: [],
          contextKey: './folder/+html.js',
          dynamic: null,
          entryPoints: ['expo-router/build/views/Navigator.js', './folder/+html.js'],
          route: 'folder/+html',
        },
      ],
      contextKey: './_layout.tsx',
      dynamic: null,
      generated: true,
      route: '',
    });
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
          contextKey: './(app)/index.js',
          dynamic: null,
          entryPoints: ['expo-router/build/views/Navigator.js', './(app)/index.js'],
          route: '(app)/index',
        },
      ],
      contextKey: './_layout.tsx',
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
          contextKey: './_sitemap.tsx',
          dynamic: null,
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
          generated: true,
          internal: true,
          route: '+not-found',
        },
        {
          children: [],
          contextKey: './(app)/index.js',
          dynamic: null,
          route: '(app)/index',
        },
      ],
      contextKey: './_layout.tsx',
      dynamic: null,
      generated: true,
      route: '',
    });
  });

  it(`should append add entry points for all parent _layouts`, () => {
    expect(
      getRoutes(
        inMemoryContext({
          './a/_layout': () => null,
          './a/b/_layout': () => null,
          './a/b/(c,d)/_layout': () => null,
          './a/b/(c,d)/e': () => null,
        }),
        { internal_stripLoadRoute: true, internal_skipGenerated: true }
      )
    ).toEqual({
      contextKey: './_layout.tsx',
      dynamic: null,
      generated: true,
      route: '',
      children: [
        {
          contextKey: './a/_layout.js',
          dynamic: null,
          route: 'a',
          children: [
            {
              contextKey: './a/b/_layout.js',
              dynamic: null,
              route: 'b',
              children: [
                {
                  contextKey: './a/b/(c,d)/_layout.js',
                  dynamic: null,
                  route: '(c)',
                  children: [
                    {
                      children: [],
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
                  dynamic: null,
                  route: '(d)',
                  children: [
                    {
                      children: [],
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

describe('dynamic routes', () => {
  it('parses dynamic routes', () => {
    expect(
      getRoutes(
        inMemoryContext({
          './[single]': () => null,
          './a/b/c/[single]': () => null,
          './[...catchAll]': () => null,
        }),
        { internal_stripLoadRoute: true, internal_skipGenerated: true }
      )
    ).toEqual({
      children: [
        {
          children: [],
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
      contextKey: './_layout.tsx',
      dynamic: null,
      generated: true,
      route: '',
    });
  });
});

//   it(`get dynamic routes`, () => {
//     expect(dropFunctions(getRoutes(ctx('./[dynamic].tsx', './[...deep].tsx'))!)).toEqual(
//       expect.objectContaining({
//         generated: true,
//         children: [
//           {
//             children: [],
//             contextKey: './[dynamic].tsx',
//             dynamic: [
//               {
//                 deep: false,
//                 name: 'dynamic',
//               },
//             ],

//             entryPoints: ['expo-router/build/views/Navigator.js', './[dynamic].tsx'],
//             route: '[dynamic]',
//           },
//           {
//             children: [],
//             contextKey: './[...deep].tsx',
//             dynamic: [
//               {
//                 deep: true,
//                 name: 'deep',
//               },
//             ],

//             entryPoints: ['expo-router/build/views/Navigator.js', './[...deep].tsx'],
//             route: '[...deep]',
//           },
//           ROUTE_DIRECTORY,
//           ROUTE_NOT_FOUND,
//           // No 404 route because we have a dynamic route
//         ],
//       })
//     );
//   });

//   it(`should convert a complex context module routes`, () => {
//     expect(
//       dropFunctions(
//         getRoutes(
//           ctx(
//             './(stack)/_layout.tsx',
//             './(stack)/home.tsx',
//             './(stack)/settings.tsx',
//             './(stack)/user/(default)/_layout.tsx',
//             './(stack)/user/(default)/posts.tsx',
//             './(stack)/user/profile.tsx',
//             './(stack)/user/[profile].tsx',
//             './(stack)/user/settings/_layout.tsx',
//             './(stack)/user/settings/info.tsx',
//             './(stack)/user/settings/[...other].tsx',
//             './another.tsx',
//             './some/nested/value.tsx'
//           )
//         )!
//       )
//     ).toEqual({
//       children: [
//         {
//           children: [
//             {
//               children: [],
//               contextKey: './(stack)/home.tsx',
//               dynamic: null,
//               route: 'home',
//               entryPoints: [
//                 'expo-router/build/views/Navigator.js',
//                 './(stack)/_layout.tsx',
//                 './(stack)/home.tsx',
//               ],
//             },
//             {
//               children: [],
//               contextKey: './(stack)/settings.tsx',
//               dynamic: null,
//               route: 'settings',
//               entryPoints: [
//                 'expo-router/build/views/Navigator.js',
//                 './(stack)/_layout.tsx',
//                 './(stack)/settings.tsx',
//               ],
//             },
//             {
//               children: [
//                 {
//                   children: [],
//                   contextKey: './(stack)/user/(default)/posts.tsx',
//                   dynamic: null,
//                   entryPoints: [
//                     'expo-router/build/views/Navigator.js',
//                     './(stack)/_layout.tsx',
//                     './(stack)/user/(default)/_layout.tsx',
//                     './(stack)/user/(default)/posts.tsx',
//                   ],
//                   route: 'posts',
//                 },
//               ],
//               contextKey: './(stack)/user/(default)/_layout.tsx',
//               dynamic: null,
//               route: 'user/(default)',
//             },
//             {
//               children: [],
//               contextKey: './(stack)/user/profile.tsx',
//               dynamic: null,
//               entryPoints: [
//                 'expo-router/build/views/Navigator.js',
//                 './(stack)/_layout.tsx',
//                 './(stack)/user/profile.tsx',
//               ],
//               route: 'user/profile',
//             },
//             {
//               children: [],
//               contextKey: './(stack)/user/[profile].tsx',
//               dynamic: [
//                 {
//                   deep: false,
//                   name: 'profile',
//                 },
//               ],
//               entryPoints: [
//                 'expo-router/build/views/Navigator.js',
//                 './(stack)/_layout.tsx',
//                 './(stack)/user/[profile].tsx',
//               ],
//               route: 'user/[profile]',
//             },
//             {
//               children: [
//                 {
//                   children: [],
//                   contextKey: './(stack)/user/settings/info.tsx',
//                   dynamic: null,
//                   entryPoints: [
//                     'expo-router/build/views/Navigator.js',
//                     './(stack)/_layout.tsx',
//                     './(stack)/user/settings/_layout.tsx',
//                     './(stack)/user/settings/info.tsx',
//                   ],
//                   route: 'info',
//                 },
//                 {
//                   children: [],
//                   entryPoints: [
//                     'expo-router/build/views/Navigator.js',
//                     './(stack)/_layout.tsx',
//                     './(stack)/user/settings/_layout.tsx',
//                     './(stack)/user/settings/[...other].tsx',
//                   ],
//                   contextKey: './(stack)/user/settings/[...other].tsx',
//                   dynamic: [{ deep: true, name: 'other' }],
//                   route: '[...other]',
//                 },
//               ],
//               contextKey: './(stack)/user/settings/_layout.tsx',
//               dynamic: null,
//               route: 'user/settings',
//             },
//           ],
//           contextKey: './(stack)/_layout.tsx',
//           dynamic: null,
//           route: '(stack)',
//         },
//         {
//           children: [],
//           contextKey: './another.tsx',
//           dynamic: null,
//           entryPoints: ['expo-router/build/views/Navigator.js', './another.tsx'],
//           route: 'another',
//         },
//         {
//           children: [],
//           entryPoints: ['expo-router/build/views/Navigator.js', './some/nested/value.tsx'],
//           contextKey: './some/nested/value.tsx',
//           dynamic: null,
//           route: 'some/nested/value',
//         },
//         ROUTE_DIRECTORY,
//         ROUTE_NOT_FOUND,
//       ],
//       contextKey: './_layout.tsx',
//       dynamic: null,
//       generated: true,
//       route: '',
//     });
//   });
//   it(`should convert an empty context module to routes`, () => {
//     expect(getRoutes(ctx())).toBeNull();
//   });
// });
