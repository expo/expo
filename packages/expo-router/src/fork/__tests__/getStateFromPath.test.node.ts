import { configFromFs } from '../../utils/mockState';
import getStateFromPath, { getUrlWithReactNavigationConcessions } from '../getStateFromPath';

describe(getUrlWithReactNavigationConcessions, () => {
  ['/', 'foo/', 'foo/bar/', 'foo/bar/baz/'].forEach((path) => {
    it(`returns the pathname for ${path}`, () => {
      expect(getUrlWithReactNavigationConcessions(path).nonstandardPathname).toBe(path);
    });
  });

  [
    ['', '/'],
    ['https://acme.com/hello/world?foo=bar#123', 'hello/world/'],
    ['https://acme.com/hello/world/?foo=bar#123', 'hello/world/'],
  ].forEach(([url, expected]) => {
    it(`returns the pathname for ${url}`, () => {
      expect(getUrlWithReactNavigationConcessions(url).nonstandardPathname).toBe(expected);
    });
  });
  [
    ['', ''],
    ['https://acme.com/hello/world/?foo=bar#123', 'https://acme.com/hello/world/?foo=bar'],
    ['/foobar#123', '/foobar'],
  ].forEach(([url, expected]) => {
    it(`returns the pathname without hash for ${url}`, () => {
      expect(getUrlWithReactNavigationConcessions(url).inputPathnameWithoutHash).toBe(expected);
    });
  });
});

it(`strips hashes`, () => {
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
        path: '/hello',
      },
    ],
  });

  expect(getStateFromPath('/hello#123', configFromFs(['[hello].js']))).toEqual({
    routes: [
      {
        name: '[hello]',
        params: {
          hello: 'hello',
        },
        path: '/hello',
      },
    ],
  });

  // TODO: Test rest params
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

  expect(getStateFromPath('/hello%20world', configFromFs(['[hello world].js']))).toEqual({
    routes: [
      {
        name: '[hello world]',
        params: {
          'hello world': 'hello%20world',
        },
        path: '/hello%20world',
      },
    ],
  });

  // TODO: Test rest params
});

it(`matches unmatched existing groups against 404`, () => {
  expect(
    getStateFromPath(
      '/(app)/(explore)',
      configFromFs([
        '[...404].js',

        '(app)/_layout.tsx',

        '(app)/(explore)/_layout.tsx',
        '(app)/(explore)/[user]/index.tsx',
        '(app)/(explore)/explore.tsx',

        '(app)/([user])/_layout.tsx',
        '(app)/([user])/[user]/index.tsx',
        '(app)/([user])/explore.tsx',
      ])
    )
  ).toEqual({
    routes: [
      {
        name: '(app)',
        params: { user: '(explore)' },
        state: {
          routes: [
            {
              name: '([user])',
              params: { user: '(explore)' },
              state: {
                routes: [
                  {
                    name: '[user]/index',
                    params: { user: '(explore)' },
                    path: '',
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

      configFromFs([
        '[foo]/_layout.tsx',
        '[foo]/bar/_layout.tsx',
        '[foo]/bar/[baz]/_layout.tsx',
        '[foo]/bar/[baz]/other.tsx',
      ])
    )
  ).toEqual({
    routes: [
      {
        name: '[foo]',
        params: { baz: 'baz', foo: 'foo' },
        state: {
          routes: [
            {
              name: 'bar',
              params: { baz: 'baz', foo: 'foo' },
              state: {
                routes: [
                  {
                    name: '[baz]',
                    params: { baz: 'baz', foo: 'foo' },
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
  });
});
