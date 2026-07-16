import { expectComplete, stripCompleteness } from './completeness';
import { getRouteInfoFromState } from '../../global-state/getRouteInfoFromState';
import { getMockConfig } from '../../testing-library';
import { extractExpoPathFromURL } from '../extractPathFromURL';
import { getPathFromState } from '../getPathFromState';
import { getStateFromPath as getStateFromPathRaw } from '../getStateFromPath';
import { getUrlWithReactNavigationConcessions, stripBaseUrl } from '../getStateFromPath-forks';

// The compiler's raw output is a complete, keyed superset of these legacy literals. Every call is
// checked for completeness here, then normalized so the pre-existing `toEqual` literals still match.
const getStateFromPath: typeof getStateFromPathRaw = (...args) => {
  const raw = getStateFromPathRaw(...args);
  // Pass the options' `screens` so completeness can also detect hollow navigator routes.
  if (raw !== undefined) expectComplete(raw, args[1]?.screens);
  return stripCompleteness(raw);
};

beforeEach(() => {
  delete process.env.EXPO_BASE_URL;
});

afterAll(() => {
  delete process.env.EXPO_BASE_URL;
});

describe(stripBaseUrl, () => {
  (
    [
      [
        // Input
        '/',
        // Base Path
        '',
        // Result
        '/',
      ],
      ['/one/two', '/one', '/two'],
      ['/one/two', '/one/two', ''],
      ['/one/two/', '/one/two', '/'],
      ['///one/', '/one', '/'],
      ['one/', '/one', 'one/'],
      ['/a/b', '/one', '/a/b'],
    ] as const
  ).forEach(([path, baseUrl, result]) => {
    it(`strips baseUrl "${path}"`, () => {
      expect(stripBaseUrl(path, baseUrl)).toBe(result);
    });
  });
});

describe('baseUrl', () => {
  beforeEach(() => {
    delete process.env.EXPO_BASE_URL;
  });

  it('accounts for baseUrl', () => {
    process.env.EXPO_BASE_URL = '/expo/prefix';

    const path = '/expo/prefix/bar';
    const config = getMockConfig(['_layout.tsx', 'bar.tsx', 'index.tsx']);

    expect(getStateFromPath<object>(path, config)).toEqual({
      routes: [
        {
          name: '__root',
          state: {
            routes: [
              {
                name: 'bar',
                path: '/bar',
              },
            ],
          },
        },
      ],
    });

    expect(getPathFromState(getStateFromPath<object>(path, config)!, config)).toBe(
      '/expo/prefix/bar'
    );
  });

  it('has baseUrl and state that does not match', () => {
    process.env.EXPO_BASE_URL = '/expo';
    const path = '/bar';
    const config = getMockConfig(['_layout.tsx', 'bar.tsx', 'index.tsx']);

    expect(getStateFromPath<object>(path, config)).toEqual({
      routes: [
        {
          name: '__root',
          state: {
            routes: [
              {
                name: 'bar',
                path: '/bar',
              },
            ],
          },
        },
      ],
    });
    expect(getPathFromState(getStateFromPath<object>(path, config)!, config)).toBe('/expo/bar');
  });
});

// Guard for retiring the `route.path` recompile branch in `useLinking` (Part 2, Step 6): the URL a
// wildcard/catch-all, encoded, or not-found route was reached by must be reproducible from the
// compiled state alone. If these hold, `useLinking` no longer needs to stash the original `path` on
// the route and recompile from it to preserve the URL.
describe('URL round-trips through the compiled state (no route.path preservation needed)', () => {
  const roundTrip = (path: string, routes: string[]) => {
    const config = getMockConfig(routes);
    return getPathFromState(getStateFromPath<object>(path, config)!, config);
  };

  it('round-trips a catch-all route', () => {
    expect(roundTrip('/blog/2024/01/hello', ['index', 'blog/[...rest]'])).toBe('/blog/2024/01/hello');
  });

  it('round-trips a catch-all route with encoded segments', () => {
    expect(roundTrip('/files/hello%20world/a', ['index', 'files/[...rest]'])).toBe(
      '/files/hello%20world/a'
    );
  });

  it('round-trips an encoded dynamic param', () => {
    expect(roundTrip('/hello%20world', ['index', '[slug]'])).toBe('/hello%20world');
  });

  it('round-trips a top-level not-found', () => {
    expect(roundTrip('/missing/page', ['index', '+not-found'])).toBe('/missing/page');
  });

  it('round-trips a catch-all with EXPO_BASE_URL', () => {
    process.env.EXPO_BASE_URL = '/expo/prefix';
    const config = getMockConfig(['index', 'blog/[...rest]']);
    expect(
      getPathFromState(getStateFromPath<object>('/expo/prefix/blog/a/b', config)!, config)
    ).toBe('/expo/prefix/blog/a/b');
  });
});

// Guard for the `NavigationContainer` unhandled-link clear (Part 2, Step 6d): instead of comparing
// a route's stashed `path` against the tracked link, the container derives the current URL from the
// committed state via `getRouteInfoFromState` and compares both normalized through
// `extractExpoPathFromURL`. This locks in that the derivation reproduces the link a handled URL was
// reached by — including a query string — so the tracked link is actually cleared.
describe('unhandled-link clear: derived current path matches the source URL (normalized)', () => {
  const derivedMatchesUrl = (url: string, routes: string[]) => {
    const config = getMockConfig(routes);
    const state = getStateFromPathRaw(url, config)!;
    const derived = extractExpoPathFromURL(
      [],
      getRouteInfoFromState(state as Parameters<typeof getRouteInfoFromState>[0]).pathnameWithParams
    );
    return { derived, source: extractExpoPathFromURL([], url) };
  };

  it('matches a plain path', () => {
    const { derived, source } = derivedMatchesUrl('/one', ['index', 'one']);
    expect(derived).toBe(source);
  });

  it('matches a path with a query string', () => {
    const { derived, source } = derivedMatchesUrl('/one?foo=bar', ['index', 'one']);
    expect(derived).toBe(source);
  });

  it('matches a catch-all path', () => {
    const { derived, source } = derivedMatchesUrl('/blog/a/b', ['index', 'blog/[...rest]']);
    expect(derived).toBe(source);
  });
});

describe(getUrlWithReactNavigationConcessions, () => {
  beforeEach(() => {
    delete process.env.EXPO_BASE_URL;
  });

  ['/', 'foo/', 'foo/bar/', 'foo/bar/baz/'].forEach((path) => {
    it(`returns the pathname for ${path}`, () => {
      expect(getUrlWithReactNavigationConcessions(path).nonstandardPathname).toBe(path);
    });
  });

  (
    [
      ['', '/'],
      ['https://acme.com/hello/world?foo=bar#123', 'hello/world/'],
      ['https://acme.com/hello/world/?foo=bar#123', 'hello/world/'],
    ] as const
  ).forEach(([url, expected]) => {
    it(`returns the pathname for ${url}`, () => {
      expect(getUrlWithReactNavigationConcessions(url).nonstandardPathname).toBe(expected);
    });
  });

  [
    ['/gh-pages/', '/'],
    ['https://acme.com/gh-pages/hello/world?foo=bar#123', 'hello/world/'],
    ['https://acme.com/gh-pages/hello/world/?foo=bar#123', 'hello/world/'],
  ].forEach(([url, expected]) => {
    it(`returns the pathname for ${url}`, () => {
      expect(getUrlWithReactNavigationConcessions(url!, 'gh-pages').nonstandardPathname).toBe(
        expected
      );
    });
  });
});

describe('hash', () => {
  it(`parses hashes`, () => {
    expect(
      getStateFromPath('/hello#123', {
        screens: {
          hello: 'hello',
        },
      } as any)
    ).toEqual({
      routes: [
        {
          name: 'hello',
          path: '/hello#123',
          params: {
            '#': '123',
          },
        },
      ],
    });
  });

  it('parses hashes with dynamic routes', () => {
    expect(getStateFromPath('/hello#123', getMockConfig(['[hello]']))).toEqual({
      routes: [
        {
          name: '__root',
          params: {
            hello: 'hello',
          },
          state: {
            routes: [
              {
                name: '[hello]',
                params: {
                  '#': '123',
                  hello: 'hello',
                },
                path: '/hello#123',
              },
            ],
          },
        },
      ],
    });
  });

  it('parses hashes with query params', () => {
    expect(getStateFromPath('/?#123', getMockConfig(['index']))).toEqual({
      routes: [
        {
          name: '__root',
          state: {
            routes: [
              {
                name: 'index',
                params: {
                  '#': '123',
                },
                path: '/?#123',
              },
            ],
          },
        },
      ],
    });

    // TODO: Test rest params
  });
});

it(`supports spaces`, () => {
  expect(
    getStateFromPath('/hello%20world', {
      screens: {
        'hello world': 'hello world',
      },
    } as any)
  ).toEqual({
    routes: [
      {
        name: 'hello world',
        path: '/hello%20world',
      },
    ],
  });

  expect(getStateFromPath('/hello%20world', getMockConfig(['[hello world]']))).toEqual({
    routes: [
      {
        name: '__root',
        params: {
          'hello world': 'hello world',
        },
        state: {
          routes: [
            {
              name: '[hello world]',
              params: {
                'hello world': 'hello world',
              },
              path: '/hello%20world',
            },
          ],
        },
      },
    ],
  });

  // TODO: Test rest params
});

it(`matches against dynamic groups`, () => {
  /*
   * This will match (app)/([user])/[user]/index with a user = '(explore)'
   * It may appear that '(explore)' is a group name but there is not value to match '[user]'
   * So it doesn't match any routes in the '(explore)' group
   * Therefore, '(explore)' is used as the value for '[user]'
   */
  expect(
    getStateFromPath(
      '/(app)/(explore)',
      getMockConfig([
        '+not-found',
        '(app)/_layout',
        '(app)/(explore)/_layout',
        '(app)/(explore)/[user]/index',
        '(app)/(explore)/explore',

        '(app)/([user])/_layout',
        '(app)/([user])/[user]/index',
        '(app)/([user])/explore',
      ])
    )
  ).toEqual({
    routes: [
      {
        name: '__root',
        params: {
          user: '(explore)',
        },
        state: {
          routes: [
            {
              name: '(app)',
              params: {
                user: '(explore)',
              },
              state: {
                routes: [
                  {
                    name: '([user])',
                    params: {
                      user: '(explore)',
                    },
                    state: {
                      routes: [
                        {
                          name: '[user]/index',
                          params: {
                            user: '(explore)',
                          },
                          path: '',
                        },
                      ],
                    },
                  },
                ],
              },
            },
          ],
        },
      },
    ],
  });
});

it(`adds dynamic route params from all levels of the path`, () => {
  // A route at `app/[foo]/bar/[baz]/other` should get all of the params from the path.
  expect(
    getStateFromPath(
      '/foo/bar/baz/other',

      getMockConfig([
        '[foo]/_layout.tsx',
        '[foo]/bar/_layout.tsx',
        '[foo]/bar/[baz]/_layout.tsx',
        '[foo]/bar/[baz]/other.tsx',
      ])
    )
  ).toEqual({
    routes: [
      {
        name: '__root',
        params: {
          baz: 'baz',
          foo: 'foo',
        },
        state: {
          routes: [
            {
              name: '[foo]',
              params: {
                baz: 'baz',
                foo: 'foo',
              },
              state: {
                routes: [
                  {
                    name: 'bar',
                    params: {
                      baz: 'baz',
                      foo: 'foo',
                    },
                    state: {
                      routes: [
                        {
                          name: '[baz]',
                          params: {
                            baz: 'baz',
                            foo: 'foo',
                          },
                          state: {
                            routes: [
                              {
                                name: 'other',
                                params: {
                                  baz: 'baz',
                                  foo: 'foo',
                                },
                                path: '/foo/bar/baz/other',
                              },
                            ],
                          },
                        },
                      ],
                    },
                  },
                ],
              },
            },
          ],
        },
      },
    ],
  });
});

it(`handles not-found routes`, () => {
  expect(getStateFromPath('/missing-page', getMockConfig(['+not-found', 'index']))).toEqual({
    routes: [
      {
        name: '__root',
        params: {
          'not-found': ['missing-page'],
        },
        state: {
          routes: [
            {
              name: '+not-found',
              params: {
                'not-found': ['missing-page'],
              },
              path: '/missing-page',
            },
          ],
        },
      },
    ],
  });
});

it(`handles query params`, () => {
  expect(
    getStateFromPath('/?test=true&hello=world&array=1&array=2', getMockConfig(['index.tsx']))
  ).toEqual({
    routes: [
      {
        name: '__root',
        state: {
          routes: [
            {
              name: 'index',
              params: {
                array: ['1', '2'],
                hello: 'world',
                test: 'true',
              },
              path: '/?test=true&hello=world&array=1&array=2',
            },
          ],
        },
      },
    ],
  });
});

it(`handles query params`, () => {
  expect(
    getStateFromPath('/?test=true&hello=world&array=1&array=2', getMockConfig(['index.tsx']))
  ).toEqual({
    routes: [
      {
        name: '__root',
        state: {
          routes: [
            {
              name: 'index',
              params: {
                array: ['1', '2'],
                hello: 'world',
                test: 'true',
              },
              path: '/?test=true&hello=world&array=1&array=2',
            },
          ],
        },
      },
    ],
  });
});

it(`matches routes with multiple spaces in path`, () => {
  expect(
    getStateFromPath('/hello%20beautiful%20world', {
      screens: {
        'hello beautiful world': 'hello beautiful world',
      },
    } as any)
  ).toEqual({
    routes: [
      {
        name: 'hello beautiful world',
        path: '/hello%20beautiful%20world',
      },
    ],
  });
});

it(`prioritizes hoisted index routes over dynamic groups`, () => {
  expect(
    getStateFromPath('/(one)', getMockConfig(['(one,two)/index.tsx', '(one,two)/[slug].tsx']))
  ).toEqual({
    routes: [
      {
        name: '__root',
        state: {
          routes: [
            {
              name: '(one)/index',
              path: '',
            },
          ],
        },
      },
    ],
  });
});
