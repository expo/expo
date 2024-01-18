import { getRoutes } from '../getRoutes';
import { inMemoryContext } from '../testing-library/context-stubs';

const originalEnv = process.env.NODE_ENV;

afterEach(() => {
  process.env.NODE_ENV = originalEnv;
});

describe('duplicate routes', () => {
  it(`doesn't throw if there are no duplicate routes`, () => {
    expect(() => {
      getRoutes(
        inMemoryContext({
          a: () => null,
          b: () => null,
          '/c/d/e.js': () => null,
          'f/g.tsx': () => null,
        })
      );
    }).not.toThrow();
  });

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

  it(`throws if there are duplicate nested routes`, () => {
    expect(() => {
      getRoutes(
        inMemoryContext({
          'a.js': () => null,
          './test/b.tsx': () => null,
          './test/b.js': () => null,
        })
      );
    }).toThrowErrorMatchingInlineSnapshot(
      `"The route files "./test/b.js" and ./test/b.tsx conflict on the route "/test/b". Please remove or rename one of these files."`
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
});

// export function getTreeForKeys(keys: string[]) {
//   const routes = keys.map((normalizedName) =>
//     asFileNode({
//       normalizedName,
//     })
//   );
//   return getRecursiveTree(routes).children;
// }

// describe(getRecursiveTree, () => {
//   it(`should assert using deprecated layout route format`, () => {
//     expect(() => getTreeForKeys(['(app)', '(app)/index'])).toThrowError(
//       /Using deprecated Layout Route format/
//     );
//   });

//   it(`should return a layout route`, () => {
//     expect(getTreeForKeys(['(app)/_layout', '(app)/index'])).toEqual([
//       {
//         children: [
//           {
//             children: [],
//             name: 'index',
//             node: expect.objectContaining({
//               normalizedName: '(app)/index',
//             }),
//             parents: ['', '(app)'],
//           },
//         ],
//         name: '(app)',
//         node: expect.objectContaining({
//           normalizedName: '(app)/_layout',
//         }),
//         parents: [''],
//       },
//     ]);
//   });

//   it(`should return a layout route using alternative format`, () => {
//     expect(getTreeForKeys(['(app)/_layout', '(app)/index'])).toEqual([
//       {
//         children: [
//           {
//             children: [],
//             name: 'index',
//             node: expect.objectContaining({
//               normalizedName: '(app)/index',
//             }),
//             parents: ['', '(app)'],
//           },
//         ],
//         name: '(app)',
//         node: expect.objectContaining({
//           normalizedName: '(app)/_layout',
//         }),
//         parents: [''],
//       },
//     ]);
//   });
// });

// describe(getUserDefinedTopLevelNotFoundRoute, () => {
//   it(`should match top-level not found files`, () => {
//     ['./+not-found.tsx', './(group)/+not-found.tsx', './(group)/(2)/+not-found.tsx'].forEach(
//       (name) => {
//         expect(getUserDefinedTopLevelNotFoundRoute(getExactRoutes(ctx(name))!)).toEqual(
//           expect.objectContaining({
//             contextKey: name,
//           })
//         );
//       }
//     );
//   });
//   it(`should not match top-level deep dynamic with nested index`, () => {
//     [
//       './(group)/+not-found/(group).tsx',
//       './(group)/+not-found/(group)/index.tsx',
//       './+not-found/index.tsx',
//       './+not-found/(group)/index.tsx',
//       './(group1)/+not-found/(group2)/index.tsx',
//       './(group1)/+not-found/(group2)/(group3)/index.tsx',
//     ].forEach((name) => {
//       expect(getUserDefinedTopLevelNotFoundRoute(getExactRoutes(ctx(name))!)).toEqual(null);
//     });
//   });

//   it(`should return a basic not-found route`, () => {
//     const routes = getExactRoutes(ctx('./+not-found.js'))!;
//     expect(getUserDefinedTopLevelNotFoundRoute(routes)).toEqual(routes.children[0]);
//   });
//   it(`does not return a nested not-found route `, () => {
//     expect(
//       getUserDefinedTopLevelNotFoundRoute(getExactRoutes(ctx('./home/+not-found.js'))!)
//     ).toEqual(null);
//   });

//   it(`should return a not-found route when nested in groups without layouts`, () => {
//     expect(
//       getUserDefinedTopLevelNotFoundRoute(
//         getExactRoutes(ctx('./(group)/(another)/+not-found.tsx'))!
//       )
//     ).toEqual(
//       expect.objectContaining({
//         route: '(group)/(another)/+not-found',
//       })
//     );
//   });
//   it(`does not return a top-level not-found`, () => {
//     expect(
//       getUserDefinedTopLevelNotFoundRoute(
//         getExactRoutes(ctx('./home/_layout.tsx', './home/+not-found.tsx'))
//       )
//     ).toEqual(null);
//   });
// });

// describe(getExactRoutes, () => {
//   // NOTE(EvanBacon): This tests when all you have is a root layout.
//   it(`automatically blocks +html file`, () => {
//     expect(
//       dropFunctions(getExactRoutes(ctx('./+html.js', './other/+html.js', './_layout.tsx'))!)
//     ).toEqual({
//       children: [
//         {
//           children: [],

//           entryPoints: ['./_layout.tsx', './other/+html.js'],
//           contextKey: './other/+html.js',
//           dynamic: null,
//           route: 'other/+html',
//         },
//       ],
//       contextKey: './_layout.tsx',
//       dynamic: null,
//       route: '',
//     });
//   });

//   it(`should allow skipping entry point logic`, () => {
//     expect(
//       dropFunctions(getExactRoutes(ctx('./some/nested/value.tsx'), { ignoreEntryPoints: true })!)
//     ).toEqual({
//       children: [
//         {
//           children: [],
//           contextKey: './some/nested/value.tsx',
//           dynamic: null,
//           route: 'some/nested/value',
//         },
//       ],
//       contextKey: './_layout.tsx',
//       dynamic: null,
//       generated: true,
//       route: '',
//     });
//   });
// });

// describe(getRoutes, () => {
//   // NOTE(EvanBacon): This tests when all you have is a root layout.
//   it(`should allow a custom root _layout route`, () => {
//     expect(dropFunctions(getRoutes(ctx('./_layout.tsx'))!)).toEqual({
//       children: [
//         {
//           children: [],
//           entryPoints: ['./_layout.tsx', 'expo-router/build/views/Unmatched.js'],
//           contextKey: './+not-found.tsx',
//           dynamic: [{ deep: true, name: '+not-found', notFound: true }],
//           generated: true,
//           internal: true,
//           route: '+not-found',
//         },
//       ],
//       contextKey: './_layout.tsx',
//       dynamic: null,
//       route: '',
//     });
//   });

//   it(`should support a single nested route without layouts`, () => {
//     expect(dropFunctions(getRoutes(ctx('./some/nested/value.tsx'))!)).toEqual({
//       children: [
//         {
//           children: [],
//           contextKey: './some/nested/value.tsx',
//           dynamic: null,
//           route: 'some/nested/value',
//           entryPoints: ['expo-router/build/views/Navigator.js', './some/nested/value.tsx'],
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
