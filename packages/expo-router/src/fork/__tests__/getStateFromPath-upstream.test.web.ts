import { findFocusedRoute } from '@react-navigation/native';
import type { InitialState } from '@react-navigation/routers';
import { produce } from 'immer';

import { getMockConfig } from '../../testing-library';
import getPathFromState from '../getPathFromState';
import getStateFromPath from '../getStateFromPath';

const changePath = <T extends InitialState>(state: T, path: string): T =>
  produce(state, (draftState) => {
    const route = findFocusedRoute(draftState);
    // @ts-expect-error: immer won't mutate this
    route.path = path;
  });

it('returns undefined for invalid path', () => {
  expect(getStateFromPath<object>('//', { screens: {} })).toBe(undefined);
});

it('converts path string to initial state with config', () => {
  const path = '/foo/bar/sweet/apple/baz/jane?count=10&answer=42&valid=true';
  const config = {
    screens: {
      Foo: {
        path: 'foo',
        screens: {
          Bar: {
            path: 'bar/:type/:fruit',
            screens: {
              Baz: {
                path: 'baz/:author',
                parse: {
                  author: (author: string) => author.replace(/^\w/, (c) => c.toUpperCase()),
                  count: Number,
                  valid: Boolean,
                },
                stringify: {
                  author: (author: string) => author.toLowerCase(),
                },
              },
            },
          },
        },
      },
    },
  };

  const state = {
    routes: [
      {
        name: 'Foo',
        params: {
          author: 'Jane',
          fruit: 'apple',
          type: 'sweet',
        },
        state: {
          routes: [
            {
              name: 'Bar',
              params: { author: 'Jane', fruit: 'apple', type: 'sweet' },
              state: {
                routes: [
                  {
                    name: 'Baz',
                    params: {
                      author: 'Jane',
                      count: 10,
                      fruit: 'apple',
                      type: 'sweet',
                      answer: '42',
                      valid: true,
                    },
                    path,
                  },
                ],
              },
            },
          ],
        },
      },
    ],
  };

  testConversions(path, config, state);
});

it('handles leading slash when converting', () => {
  const path = '/foo/bar/?count=42';

  expect(
    getStateFromPath<object>(path, {
      screens: {
        foo: {
          path: 'foo',
          screens: {
            bar: {
              path: 'bar',
            },
          },
        },
      },
    })
  ).toEqual({
    routes: [
      {
        name: 'foo',
        state: {
          routes: [
            {
              name: 'bar',
              params: { count: '42' },
              path,
            },
          ],
        },
      },
    ],
  });
});

it('handles ending slash when converting', () => {
  const path = 'foo/bar/?count=42';

  expect(
    getStateFromPath<object>(path, {
      screens: {
        foo: {
          path: 'foo',
          screens: {
            bar: {
              path: 'bar',
            },
          },
        },
      },
    })
  ).toEqual({
    routes: [
      {
        name: 'foo',
        state: {
          routes: [
            {
              name: 'bar',
              params: { count: '42' },
              path,
            },
          ],
        },
      },
    ],
  });
});

it('converts path string to initial state with config with nested screens', () => {
  const path = '/foe/bar/sweet/apple/baz/jane?count=10&answer=42&valid=true';
  const config = {
    screens: {
      Foo: {
        path: 'foo',
        screens: {
          Foe: {
            path: 'foe',
            exact: true,
            screens: {
              Bar: {
                path: 'bar/:type/:fruit',
                screens: {
                  Baz: {
                    path: 'baz/:author',
                    parse: {
                      author: (author: string) => author.replace(/^\w/, (c) => c.toUpperCase()),
                      count: Number,
                      valid: Boolean,
                    },
                    stringify: {
                      author: (author: string) => author.toLowerCase(),
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  };

  const state = {
    routes: [
      {
        name: 'Foo',
        params: {
          fruit: 'apple',
          type: 'sweet',
          author: 'Jane',
        },
        state: {
          routes: [
            {
              name: 'Foe',
              params: {
                fruit: 'apple',
                type: 'sweet',
                author: 'Jane',
              },
              state: {
                routes: [
                  {
                    name: 'Bar',
                    params: {
                      fruit: 'apple',
                      type: 'sweet',
                      author: 'Jane',
                    },
                    state: {
                      routes: [
                        {
                          name: 'Baz',
                          params: {
                            fruit: 'apple',
                            type: 'sweet',
                            author: 'Jane',
                            count: 10,
                            answer: '42',
                            valid: true,
                          },
                          path,
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
  };

  testConversions(path, config, state);
});

it('converts path string to initial state with config with nested screens and unused parse functions', () => {
  const path = '/foe/baz/jane?count=10&answer=42&valid=true';
  const config = {
    screens: {
      Foo: {
        path: 'foo',
        screens: {
          Foe: {
            path: 'foe',
            exact: true,
            screens: {
              Baz: {
                path: 'baz/:author',
                parse: {
                  author: (author: string) => author.replace(/^\w/, (c) => c.toUpperCase()),
                  count: Number,
                  valid: Boolean,
                  id: Boolean,
                },
              },
            },
          },
        },
      },
    },
  };

  const state = {
    routes: [
      {
        name: 'Foo',
        params: {
          author: 'Jane',
        },
        state: {
          routes: [
            {
              name: 'Foe',
              params: {
                author: 'Jane',
              },
              state: {
                routes: [
                  {
                    name: 'Baz',
                    params: {
                      author: 'Jane',
                      count: 10,
                      answer: '42',
                      valid: true,
                    },
                    path,
                  },
                ],
              },
            },
          ],
        },
      },
    ],
  };

  expect(getStateFromPath<object>(path, config)).toEqual(state);
  expect(getStateFromPath<object>(getPathFromState<object>(state, config), config)).toEqual(
    changePath(state, '/foe/baz/Jane?count=10&answer=42&valid=true')
  );
});

it('handles nested object with unused configs and with parse in it', () => {
  const path = '/bar/sweet/apple/foe/bis/jane?count=10&answer=42&valid=true';
  const config = {
    screens: {
      Bar: {
        path: 'bar/:type/:fruit',
        screens: {
          Foo: {
            screens: {
              Foe: {
                path: 'foe',
                screens: {
                  Baz: {
                    screens: {
                      Bos: {
                        path: 'bos',
                        exact: true,
                      },
                      Bis: {
                        path: 'bis/:author',
                        stringify: {
                          author: (author: string) => author.replace(/^\w/, (c) => c.toLowerCase()),
                        },
                        parse: {
                          author: (author: string) => author.replace(/^\w/, (c) => c.toUpperCase()),
                          count: Number,
                          valid: Boolean,
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  };

  const state = {
    routes: [
      {
        name: 'Bar',
        params: { fruit: 'apple', type: 'sweet', author: 'Jane' },
        state: {
          routes: [
            {
              name: 'Foo',
              params: {
                author: 'Jane',
                fruit: 'apple',
                type: 'sweet',
              },
              state: {
                routes: [
                  {
                    name: 'Foe',
                    params: {
                      author: 'Jane',
                      fruit: 'apple',
                      type: 'sweet',
                    },
                    state: {
                      routes: [
                        {
                          name: 'Baz',
                          params: {
                            author: 'Jane',
                            fruit: 'apple',
                            type: 'sweet',
                          },
                          state: {
                            routes: [
                              {
                                name: 'Bis',
                                params: {
                                  author: 'Jane',
                                  count: 10,
                                  answer: '42',
                                  valid: true,
                                  fruit: 'apple',
                                  type: 'sweet',
                                },
                                path,
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
  };

  testConversions(path, config, state);
});

it('handles parse in nested object for second route depth', () => {
  const path = '/baz';
  const config = {
    screens: {
      Foo: {
        path: 'foo',
        screens: {
          Foe: {
            path: 'foe',
            exact: true,
          },
          Bar: {
            path: 'bar',
            exact: true,
            screens: {
              Baz: {
                path: 'baz',
                exact: true,
              },
            },
          },
        },
      },
    },
  };

  const state = {
    routes: [
      {
        name: 'Foo',
        state: {
          routes: [
            {
              name: 'Bar',
              state: {
                routes: [{ name: 'Baz', path }],
              },
            },
          ],
        },
      },
    ],
  };

  testConversions(path, config, state);
});

it('handles parse in nested object for second route depth and and path and parse in roots', () => {
  const path = '/baz';
  const config = {
    screens: {
      Foo: {
        path: 'foo/:id',
        parse: {
          id: Number,
        },
        stringify: {
          id: (id: number) => `id=${id}`,
        },
        screens: {
          Foe: 'foe',
          Bar: {
            screens: {
              Baz: {
                path: 'baz',
                exact: true,
              },
            },
          },
        },
      },
    },
  };

  const state = {
    routes: [
      {
        name: 'Foo',
        state: {
          routes: [
            {
              name: 'Bar',
              state: {
                routes: [{ name: 'Baz', path }],
              },
            },
          ],
        },
      },
    ],
  };

  testConversions(path, config, state);
});

it('handles initialRouteName inside a screen', () => {
  const path = '/baz';
  const config = {
    screens: {
      Foo: {
        initialRouteName: 'Foe',
        screens: {
          Foe: 'foe',
          Bar: {
            screens: {
              Baz: 'baz',
            },
          },
        },
      },
    },
  };

  const state = {
    routes: [
      {
        name: 'Foo',
        state: {
          index: 1,
          routes: [
            {
              name: 'Foe',
            },
            {
              name: 'Bar',
              state: {
                routes: [{ name: 'Baz', path }],
              },
            },
          ],
        },
      },
    ],
  };

  testConversions(path, config, state);
});

it('handles initialRouteName included in path', () => {
  const path = '/baz';
  const config = {
    screens: {
      Foo: {
        initialRouteName: 'Foe',
        screens: {
          Foe: {
            screens: {
              Baz: 'baz',
            },
          },
          Bar: 'bar',
        },
      },
    },
  };

  const state = {
    routes: [
      {
        name: 'Foo',
        state: {
          routes: [
            {
              name: 'Foe',
              state: {
                routes: [{ name: 'Baz', path }],
              },
            },
          ],
        },
      },
    ],
  };

  testConversions(path, config, state);
});

it('handles two initialRouteNames', () => {
  const path = '/bar/sweet/apple/foe/bis/jane?answer=42&count=10&valid=true';
  const config = {
    screens: {
      Bar: {
        path: 'bar/:type/:fruit',
        screens: {
          Foo: {
            screens: {
              Foe: {
                path: 'foe',
                screens: {
                  Baz: {
                    initialRouteName: 'Bos',
                    screens: {
                      Bos: {
                        path: 'bos',
                        exact: true,
                      },
                      Bis: {
                        path: 'bis/:author',
                        stringify: {
                          author: (author: string) => author.replace(/^\w/, (c) => c.toLowerCase()),
                        },
                        parse: {
                          author: (author: string) => author.replace(/^\w/, (c) => c.toUpperCase()),
                          count: Number,
                          valid: Boolean,
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  };

  const state = {
    routes: [
      {
        name: 'Bar',
        params: { author: 'Jane', fruit: 'apple', type: 'sweet' },
        state: {
          routes: [
            {
              name: 'Foo',
              params: { author: 'Jane', fruit: 'apple', type: 'sweet' },
              state: {
                routes: [
                  {
                    name: 'Foe',
                    params: { author: 'Jane', fruit: 'apple', type: 'sweet' },
                    state: {
                      routes: [
                        {
                          name: 'Baz',
                          params: {
                            author: 'Jane',
                            fruit: 'apple',
                            type: 'sweet',
                          },
                          state: {
                            index: 1,
                            routes: [
                              {
                                name: 'Bos',
                                params: {
                                  author: 'Jane',
                                  fruit: 'apple',
                                  type: 'sweet',
                                },
                              },
                              {
                                name: 'Bis',
                                params: {
                                  answer: '42',
                                  author: 'Jane',
                                  count: 10,
                                  valid: true,
                                  fruit: 'apple',
                                  type: 'sweet',
                                },
                                path,
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
  };

  testConversions(path, config, state);
});

it('accepts initialRouteName without config for it', () => {
  const path = '/bar/sweet/apple/foe/bis/jane?answer=42&count=10&valid=true';
  const config = {
    screens: {
      Bar: {
        path: 'bar/:type/:fruit',
        screens: {
          Foo: {
            screens: {
              Foe: {
                path: 'foe',
                screens: {
                  Baz: {
                    initialRouteName: 'Bas',
                    screens: {
                      Bos: {
                        path: 'bos',
                        exact: true,
                      },
                      Bis: {
                        path: 'bis/:author',
                        stringify: {
                          author: (author: string) => author.replace(/^\w/, (c) => c.toLowerCase()),
                        },
                        parse: {
                          author: (author: string) => author.replace(/^\w/, (c) => c.toUpperCase()),
                          count: Number,
                          valid: Boolean,
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  };

  const state = {
    routes: [
      {
        name: 'Bar',
        params: { author: 'Jane', fruit: 'apple', type: 'sweet' },
        state: {
          routes: [
            {
              name: 'Foo',
              params: { author: 'Jane', fruit: 'apple', type: 'sweet' },
              state: {
                routes: [
                  {
                    name: 'Foe',
                    params: { author: 'Jane', fruit: 'apple', type: 'sweet' },
                    state: {
                      routes: [
                        {
                          name: 'Baz',
                          params: {
                            author: 'Jane',
                            fruit: 'apple',
                            type: 'sweet',
                          },
                          state: {
                            index: 1,
                            routes: [
                              {
                                name: 'Bas',
                                params: {
                                  author: 'Jane',
                                  fruit: 'apple',
                                  type: 'sweet',
                                },
                              },
                              {
                                name: 'Bis',
                                params: {
                                  answer: '42',
                                  author: 'Jane',
                                  count: 10,
                                  fruit: 'apple',
                                  type: 'sweet',
                                  valid: true,
                                },
                                path: '/bar/sweet/apple/foe/bis/jane?answer=42&count=10&valid=true',
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
  };

  testConversions(path, config, state);
});

it('returns undefined if path is empty and no matching screen is present', () => {
  const config = {
    screens: {
      Foo: {
        screens: {
          Foe: 'foe',
          Bar: {
            screens: {
              Baz: 'baz',
            },
          },
        },
      },
    },
  };

  const path = '';

  expect(getStateFromPath<object>(path, config)).toEqual(undefined);
});

it('returns matching screen if path is empty', () => {
  const path = '';
  const config = {
    screens: {
      Foo: {
        screens: {
          Foe: 'foe',
          Bar: {
            screens: {
              Qux: '',
              Baz: 'baz',
            },
          },
        },
      },
    },
  };

  const state = {
    routes: [
      {
        name: 'Foo',
        state: {
          routes: [
            {
              name: 'Bar',
              state: {
                routes: [{ name: 'Qux', path }],
              },
            },
          ],
        },
      },
    ],
  };

  expect(getStateFromPath<object>(path, config)).toEqual(state);
  expect(getStateFromPath<object>(getPathFromState<object>(state, config), config)).toEqual(
    changePath(state, '/')
  );
});

it('returns matching screen if path is only slash', () => {
  const path = '/';
  const config = {
    screens: {
      Foo: {
        screens: {
          Foe: 'foe',
          Bar: {
            screens: {
              Qux: '',
              Baz: 'baz',
            },
          },
        },
      },
    },
  };

  const state = {
    routes: [
      {
        name: 'Foo',
        state: {
          routes: [
            {
              name: 'Bar',
              state: {
                routes: [{ name: 'Qux', path }],
              },
            },
          ],
        },
      },
    ],
  };

  expect(getStateFromPath<object>(path, config)).toEqual(state);
  expect(getStateFromPath<object>(getPathFromState<object>(state, config), config)).toEqual(
    changePath(state, '/')
  );
});

// Test `app/(app)/index.js` matching `/`
it('returns matching screen if path is only slash and root is a group', () => {
  expect(
    getStateFromPath<object>('/', {
      screens: {
        '(app)/index': '(app)',
        '[id]': ':id',
        '[...slug]': '*slug',
      },
    })
  ).toEqual({ routes: [{ name: '(app)/index', path: '/' }] });
});

// Test `app/(one)/(two)/index.js` matching `/`
it('returns matching screen if path is only slash and root is a nested group', () => {
  expect(
    getStateFromPath<object>('/', {
      screens: {
        '(one)/(two)/index': '(one)/(two)',
        '[id]': ':id',
        '[...slug]': '*slug',
      },
    })
  ).toEqual({ routes: [{ name: '(one)/(two)/index', path: '/' }] });
});

it('returns matching screen with params if path is empty', () => {
  const path = '?foo=42';
  const config = {
    screens: {
      Foo: {
        screens: {
          Foe: 'foe',
          Bar: {
            screens: {
              Qux: {
                path: '',
                parse: { foo: Number },
              },
              Baz: 'baz',
            },
          },
        },
      },
    },
  };

  const state = {
    routes: [
      {
        name: 'Foo',
        state: {
          routes: [
            {
              name: 'Bar',
              state: {
                routes: [{ name: 'Qux', params: { foo: 42 }, path }],
              },
            },
          ],
        },
      },
    ],
  };

  expect(getStateFromPath<object>(path, config)).toEqual(state);
  expect(getStateFromPath<object>(getPathFromState<object>(state, config), config)).toEqual(
    changePath(state, '/?foo=42')
  );
});

it("doesn't match nested screen if path is empty", () => {
  const config = {
    screens: {
      Foo: {
        screens: {
          Foe: 'foe',
          Bar: {
            path: 'bar',
            screens: {
              Qux: {
                path: '',
                parse: { foo: Number },
              },
            },
          },
        },
      },
    },
  };

  const path = '';

  expect(getStateFromPath<object>(path, config)).toEqual(undefined);
});

it('chooses more exhaustive pattern', () => {
  const path = '/foo/5';

  const config = {
    screens: {
      Foe: {
        path: '/',
        initialRouteName: 'Foo',
        screens: {
          Foo: 'foo',
          Bis: {
            path: 'foo/:id',
            parse: {
              id: Number,
            },
          },
        },
      },
    },
  };

  const state = {
    routes: [
      {
        name: 'Foe',
        params: {
          id: 5,
        },
        state: {
          index: 1,
          routes: [
            {
              name: 'Foo',
              params: { id: 5 },
            },
            {
              name: 'Bis',
              params: { id: 5 },
              path,
            },
          ],
        },
      },
    ],
  };

  testConversions(path, config, state);
});

it('handles same paths beginnings', () => {
  const path = '/foos';

  const config = {
    screens: {
      Foe: {
        path: '/',
        initialRouteName: 'Foo',
        screens: {
          Foo: 'foo',
          Bis: {
            path: 'foos',
          },
        },
      },
    },
  };

  const state = {
    routes: [
      {
        name: 'Foe',
        state: {
          index: 1,
          routes: [
            {
              name: 'Foo',
            },
            {
              name: 'Bis',
              path,
            },
          ],
        },
      },
    ],
  };

  testConversions(path, config, state);
});

it('handles same paths beginnings with params', () => {
  const path = '/foos/5';

  const config = {
    screens: {
      Foe: {
        path: '/',
        initialRouteName: 'Foo',
        screens: {
          Foo: 'foo',
          Bis: {
            path: 'foos/:id',
            parse: {
              id: Number,
            },
          },
        },
      },
    },
  };

  const state = {
    routes: [
      {
        name: 'Foe',
        params: {
          id: 5,
        },

        state: {
          index: 1,
          routes: [
            {
              name: 'Foo',
              params: { id: 5 },
            },
            {
              name: 'Bis',
              params: { id: 5 },
              path,
            },
          ],
        },
      },
    ],
  };

  testConversions(path, config, state);
});

it('handles not taking path with too many segments', () => {
  const path = '/foos/5';

  const config = {
    screens: {
      Foe: {
        path: '/',
        initialRouteName: 'Foo',
        screens: {
          Foo: 'foo',
          Bis: {
            path: 'foos/:id',
            parse: {
              id: Number,
            },
          },
          Bas: {
            path: 'foos/:id/:nip',
            parse: {
              id: Number,
              pwd: Number,
            },
          },
        },
      },
    },
  };

  const state = {
    routes: [
      {
        name: 'Foe',
        params: {
          id: 5,
        },

        state: {
          index: 1,
          routes: [
            {
              name: 'Foo',
              params: { id: 5 },
            },
            {
              name: 'Bis',
              params: { id: 5 },
              path,
            },
          ],
        },
      },
    ],
  };

  testConversions(path, config, state);
});

it('handles differently ordered params v1', () => {
  const path = '/foos/5/res/20';

  const config = {
    screens: {
      Foe: {
        path: '/',
        initialRouteName: 'Foo',
        screens: {
          Foo: 'foo',
          Bis: {
            path: 'foos/:id',
            parse: {
              id: Number,
            },
          },
          Bas: {
            path: 'foos/:id/res/:pwd',
            parse: {
              id: Number,
              pwd: Number,
            },
          },
        },
      },
    },
  };

  const state = {
    routes: [
      {
        name: 'Foe',
        params: {
          id: 5,
          pwd: 20,
        },
        state: {
          index: 1,
          routes: [
            {
              name: 'Foo',
              params: { id: 5, pwd: 20 },
            },
            {
              name: 'Bas',
              params: { id: 5, pwd: 20 },
              path,
            },
          ],
        },
      },
    ],
  };

  testConversions(path, config, state);
});

it('handles differently ordered params v2', () => {
  const path = '/5/20/foos/res';

  const config = {
    screens: {
      Foe: {
        path: '/',
        initialRouteName: 'Foo',
        screens: {
          Foo: 'foo',
          Bis: {
            path: 'foos/:id',
            parse: {
              id: Number,
            },
          },
          Bas: {
            path: ':id/:pwd/foos/res',
            parse: {
              id: Number,
              pwd: Number,
            },
          },
        },
      },
    },
  };

  const state = {
    routes: [
      {
        name: 'Foe',
        params: {
          id: 5,
          pwd: 20,
        },

        state: {
          index: 1,
          routes: [
            {
              name: 'Foo',
              params: { id: 5, pwd: 20 },
            },
            {
              name: 'Bas',
              params: { id: 5, pwd: 20 },
              path,
            },
          ],
        },
      },
    ],
  };

  testConversions(path, config, state);
});

it('handles differently ordered params v3', () => {
  const path = '/foos/5/20/res';

  const config = {
    screens: {
      Foe: {
        path: '/',
        initialRouteName: 'Foo',
        screens: {
          Foo: 'foo',
          Bis: {
            path: 'foos/:id',
            parse: {
              id: Number,
            },
          },
          Bas: {
            path: 'foos/:id/:pwd/res',
            parse: {
              id: Number,
              pwd: Number,
            },
          },
        },
      },
    },
  };

  const state = {
    routes: [
      {
        name: 'Foe',
        params: {
          id: 5,
          pwd: 20,
        },
        state: {
          index: 1,
          routes: [
            {
              name: 'Foo',
              params: { id: 5, pwd: 20 },
            },
            {
              name: 'Bas',
              params: { id: 5, pwd: 20 },
              path,
            },
          ],
        },
      },
    ],
  };

  testConversions(path, config, state);
});

it('handles differently ordered params v4', () => {
  const path = '5/foos/res/20';

  const config = {
    screens: {
      Foe: {
        path: '/',
        initialRouteName: 'Foo',
        screens: {
          Foo: 'foo',
          Bis: {
            path: 'foos/:id',
            parse: {
              id: Number,
            },
          },
          Bas: {
            path: ':id/foos/res/:pwd',
            parse: {
              id: Number,
              pwd: Number,
            },
          },
        },
      },
    },
  };

  const state = {
    routes: [
      {
        name: 'Foe',
        params: {
          id: 5,
          pwd: 20,
        },
        state: {
          index: 1,
          routes: [
            {
              name: 'Foo',
              params: { id: 5, pwd: 20 },
            },
            {
              name: 'Bas',
              params: { id: 5, pwd: 20 },
              path,
            },
          ],
        },
      },
    ],
  };

  expect(getStateFromPath<object>(path, config)).toEqual(state);
  expect(getStateFromPath<object>(getPathFromState<object>(state, config), config)).toEqual(
    changePath(state, '/5/foos/res/20')
  );
});

it('handles simple optional params', () => {
  const path = '/foos/5';

  const config = {
    screens: {
      Foe: {
        path: '/',
        initialRouteName: 'Foo',
        screens: {
          Foo: 'foo',
          Bis: {
            path: 'foo/:id',
            parse: {
              id: Number,
            },
          },
          Bas: {
            path: 'foos/:id/:nip?',
            parse: {
              id: Number,
              nip: Number,
            },
          },
        },
      },
    },
  };

  const state = {
    routes: [
      {
        name: 'Foe',
        params: {
          id: 5,
        },
        state: {
          index: 1,
          routes: [
            {
              name: 'Foo',
              params: { id: 5 },
            },
            {
              name: 'Bas',
              params: { id: 5 },
              path,
            },
          ],
        },
      },
    ],
  };

  testConversions(path, config, state);
});

it('handle 2 optional params at the end v1', () => {
  const path = '/foos/5';

  const config = {
    screens: {
      Foe: {
        path: '/',
        initialRouteName: 'Foo',
        screens: {
          Foo: 'foo',
          Bis: {
            path: 'foo/:id',
            parse: {
              id: Number,
            },
          },
          Bas: {
            path: 'foos/:id/:nip?/:pwd?',
            parse: {
              id: Number,
              nip: Number,
            },
          },
        },
      },
    },
  };

  const state = {
    routes: [
      {
        name: 'Foe',
        params: {
          id: 5,
        },
        state: {
          index: 1,
          routes: [
            {
              name: 'Foo',
              params: { id: 5 },
            },
            {
              name: 'Bas',
              params: { id: 5 },
              path,
            },
          ],
        },
      },
    ],
  };

  testConversions(path, config, state);
});

it('handle 2 optional params at the end v2', () => {
  const path = '/foos/5/10';

  const config = {
    screens: {
      Foe: {
        path: '/',
        initialRouteName: 'Foo',
        screens: {
          Foo: 'foo',
          Bis: {
            path: 'foo/:id',
            parse: {
              id: Number,
            },
          },
          Bas: {
            path: 'foos/:id/:nip?/:pwd?',
            parse: {
              id: Number,
              nip: Number,
            },
          },
        },
      },
    },
  };

  const state = {
    routes: [
      {
        name: 'Foe',
        params: {
          id: 5,
          nip: 10,
        },

        state: {
          index: 1,
          routes: [
            {
              name: 'Foo',
              params: { id: 5, nip: 10 },
            },
            {
              name: 'Bas',
              params: { id: 5, nip: 10 },
              path,
            },
          ],
        },
      },
    ],
  };

  testConversions(path, config, state);
});

it('handle 2 optional params at the end v3', () => {
  const path = '/foos/5/10/15';

  const config = {
    screens: {
      Foe: {
        path: '/',
        initialRouteName: 'Foo',
        screens: {
          Foo: 'foo',
          Bis: {
            path: 'foo/:id',
            parse: {
              id: Number,
            },
          },
          Bas: {
            path: 'foos/:id/:nip?/:pwd?',
            parse: {
              id: Number,
              nip: Number,
              pwd: Number,
            },
          },
        },
      },
    },
  };

  const state = {
    routes: [
      {
        name: 'Foe',
        params: {
          nip: 10,
          pwd: 15,
          id: 5,
        },
        state: {
          index: 1,
          routes: [
            {
              name: 'Foo',
              params: { id: 5, nip: 10, pwd: 15 },
            },
            {
              name: 'Bas',
              params: { id: 5, nip: 10, pwd: 15 },
              path,
            },
          ],
        },
      },
    ],
  };

  testConversions(path, config, state);
});

it('handle optional params in the middle v1', () => {
  const path = '/foos/5/10';

  const config = {
    screens: {
      Foe: {
        path: '/',
        initialRouteName: 'Foo',
        screens: {
          Foo: 'foo',
          Bis: {
            path: 'foo/:id',
            parse: {
              id: Number,
            },
          },
          Bas: {
            path: 'foos/:id/:nip?/:pwd',
            parse: {
              id: Number,
              nip: Number,
              pwd: Number,
            },
          },
        },
      },
    },
  };

  const state = {
    routes: [
      {
        name: 'Foe',
        params: {
          id: 5,
          pwd: 10,
        },

        state: {
          index: 1,
          routes: [
            {
              name: 'Foo',
              params: { id: 5, pwd: 10 },
            },
            {
              name: 'Bas',
              params: { id: 5, pwd: 10 },
              path,
            },
          ],
        },
      },
    ],
  };

  testConversions(path, config, state);
});

it('handle optional params in the middle v2', () => {
  const path = '/foos/5/10/15';

  const config = {
    screens: {
      Foe: {
        path: '/',
        initialRouteName: 'Foo',
        screens: {
          Foo: 'foo',
          Bis: {
            path: 'foo/:id',
            parse: {
              id: Number,
            },
          },
          Bas: {
            path: 'foos/:id/:nip?/:pwd',
            parse: {
              id: Number,
              nip: Number,
              pwd: Number,
            },
          },
        },
      },
    },
  };

  const state = {
    routes: [
      {
        name: 'Foe',
        params: {
          id: 5,
          nip: 10,
          pwd: 15,
        },
        state: {
          index: 1,
          routes: [
            {
              name: 'Foo',
              params: { id: 5, nip: 10, pwd: 15 },
            },
            {
              name: 'Bas',
              params: { id: 5, nip: 10, pwd: 15 },
              path,
            },
          ],
        },
      },
    ],
  };

  testConversions(path, config, state);
});

it('handle optional params in the middle v3', () => {
  const path = '/foos/5/10/15';

  const config = {
    screens: {
      Foe: {
        path: '/',
        initialRouteName: 'Foo',
        screens: {
          Foo: 'foo',
          Bis: {
            path: 'foo/:id',
            parse: {
              id: Number,
            },
          },
          Bas: {
            path: 'foos/:id/:nip?/:pwd/:smh',
            parse: {
              id: Number,
              nip: Number,
              pwd: Number,
              smh: Number,
            },
          },
        },
      },
    },
  };

  const state = {
    routes: [
      {
        name: 'Foe',
        params: {
          id: 5,
          pwd: 10,
          smh: 15,
        },

        state: {
          index: 1,
          routes: [
            {
              name: 'Foo',
              params: { id: 5, pwd: 10, smh: 15 },
            },
            {
              name: 'Bas',
              params: { id: 5, pwd: 10, smh: 15 },
              path,
            },
          ],
        },
      },
    ],
  };

  testConversions(path, config, state);
});

it('handle optional params in the middle v4', () => {
  const path = '/foos/5/10';

  const config = {
    screens: {
      Foe: {
        path: '/',
        initialRouteName: 'Foo',
        screens: {
          Foo: 'foo',
          Bis: {
            path: 'foo/:id',
            parse: {
              id: Number,
            },
          },
          Bas: {
            path: 'foos/:nip?/:pwd/:smh?/:id',
            parse: {
              id: Number,
              nip: Number,
              pwd: Number,
              smh: Number,
            },
          },
        },
      },
    },
  };

  const state = {
    routes: [
      {
        name: 'Foe',
        params: {
          id: 10,
          pwd: 5,
        },
        state: {
          index: 1,
          routes: [
            {
              name: 'Foo',
              params: { pwd: 5, id: 10 },
            },
            {
              name: 'Bas',
              params: { pwd: 5, id: 10 },
              path,
            },
          ],
        },
      },
    ],
  };

  testConversions(path, config, state);
});

it('handle optional params in the middle v5', () => {
  const path = '/foos/5/10/15';

  const config = {
    screens: {
      Foe: {
        path: '/',
        initialRouteName: 'Foo',
        screens: {
          Foo: 'foo',
          Bis: {
            path: 'foo/:id',
            parse: {
              id: Number,
            },
          },
          Bas: {
            path: 'foos/:nip?/:pwd/:smh?/:id',
            parse: {
              id: Number,
              nip: Number,
              pwd: Number,
              smh: Number,
            },
          },
        },
      },
    },
  };

  const state = {
    routes: [
      {
        name: 'Foe',
        params: {
          id: 15,
          nip: 5,
          pwd: 10,
        },

        state: {
          index: 1,
          routes: [
            {
              name: 'Foo',
              params: { nip: 5, pwd: 10, id: 15 },
            },
            {
              name: 'Bas',
              params: { nip: 5, pwd: 10, id: 15 },
              path,
            },
          ],
        },
      },
    ],
  };

  testConversions(path, config, state);
});

it('handle optional params in the beginning v1', () => {
  const path = '5/10/foos/15';

  const config = {
    screens: {
      Foe: {
        path: '/',
        initialRouteName: 'Foo',
        screens: {
          Foo: 'foo',
          Bis: {
            path: 'foo/:id',
            parse: {
              id: Number,
            },
          },
          Bas: {
            path: ':nip?/:pwd/foos/:smh?/:id',
            parse: {
              id: Number,
              nip: Number,
              pwd: Number,
              smh: Number,
            },
          },
        },
      },
    },
  };

  const state = {
    routes: [
      {
        name: 'Foe',
        params: {
          id: 15,
          nip: 5,
          pwd: 10,
        },
        state: {
          index: 1,
          routes: [
            {
              name: 'Foo',
              params: { nip: 5, pwd: 10, id: 15 },
            },
            {
              name: 'Bas',
              params: { nip: 5, pwd: 10, id: 15 },
              path,
            },
          ],
        },
      },
    ],
  };

  expect(getStateFromPath<object>(path, config)).toEqual(state);
  expect(getStateFromPath<object>(getPathFromState<object>(state, config), config)).toEqual(
    changePath(state, '/5/10/foos/15')
  );
});

it('handle optional params in the beginning v2', () => {
  const path = '5/10/foos/15';

  const config = {
    screens: {
      Foe: {
        path: '/',
        initialRouteName: 'Foo',
        screens: {
          Foo: 'foo',
          Bis: {
            path: 'foo/:id',
            parse: {
              id: Number,
            },
          },
          Bas: {
            path: ':nip?/:smh?/:pwd/foos/:id',
            parse: {
              id: Number,
              nip: Number,
              pwd: Number,
              smh: Number,
            },
          },
        },
      },
    },
  };

  const state = {
    routes: [
      {
        name: 'Foe',
        params: {
          id: 15,
          nip: 5,
          pwd: 10,
        },
        state: {
          index: 1,
          routes: [
            {
              name: 'Foo',
              params: { nip: 5, pwd: 10, id: 15 },
            },
            {
              name: 'Bas',
              params: { nip: 5, pwd: 10, id: 15 },
              path,
            },
          ],
        },
      },
    ],
  };

  expect(getStateFromPath<object>(path, config)).toEqual(state);
  expect(getStateFromPath<object>(getPathFromState<object>(state, config), config)).toEqual(
    changePath(state, '/5/10/foos/15')
  );
});

it('merges parent patterns if needed', () => {
  const path = 'foo/42/baz/babel';

  const config = {
    screens: {
      Foo: {
        path: 'foo/:bar',
        parse: {
          bar: Number,
        },
        screens: {
          Baz: 'baz/:qux',
        },
      },
    },
  };

  const state = {
    routes: [
      {
        name: 'Foo',
        params: { bar: 42, qux: 'babel' },
        state: {
          routes: [
            {
              name: 'Baz',
              params: { bar: 42, qux: 'babel' },
              path,
            },
          ],
        },
      },
    ],
  };

  expect(getStateFromPath<object>(path, config)).toEqual(state);
  expect(getStateFromPath<object>(getPathFromState<object>(state, config), config)).toEqual(
    changePath(state, '/foo/42/baz/babel')
  );
});

it('ignores extra slashes in the pattern', () => {
  const path = '/bar/42';
  const config = {
    screens: {
      Foo: {
        screens: {
          Bar: {
            path: '/bar//:id/',
          },
        },
      },
    },
  };

  const state = {
    routes: [
      {
        name: 'Foo',
        params: {
          id: '42',
        },
        state: {
          routes: [
            {
              name: 'Bar',
              params: { id: '42' },
              path,
            },
          ],
        },
      },
    ],
  };

  testConversions(path, config, state);
});

it('matches wildcard patterns at root', () => {
  const path = '/test/bar/42/whatever';
  const config = getMockConfig(['[...slug].js', 'foo/bar.js', 'index.js']);
  const state = {
    routes: [
      {
        params: {
          slug: ['test', 'bar', '42', 'whatever'],
        },
        name: '[...slug]',
        path,
      },
    ],
  };

  testConversions(path, config, state);
});

it('matches wildcard patterns at nested level', () => {
  const path = '/bar/42/whatever/baz/initt';

  const config = getMockConfig([
    '(foo)/_layout.tsx',
    '(foo)/bar/_layout.tsx',
    '(foo)/bar/[id].tsx',
    '(foo)/bar/[...rest].tsx',
  ]);

  const state = {
    routes: [
      {
        name: '(foo)',
        params: { rest: ['42', 'whatever', 'baz', 'initt'] },
        state: {
          routes: [
            {
              name: 'bar',
              params: { rest: ['42', 'whatever', 'baz', 'initt'] },
              state: {
                routes: [
                  {
                    name: '[...rest]',
                    params: {
                      rest: ['42', 'whatever', 'baz', 'initt'],
                    },
                    path: '/bar/42/whatever/baz/initt',
                  },
                ],
              },
            },
          ],
        },
      },
    ],
  };

  testConversions(path, config, state);
});

xit('matches wildcard patterns at nested level with exact', () => {
  const path = '/whatever';
  const config = {
    screens: {
      Foo: {
        screens: {
          Bar: {
            path: '/bar/:id/',
            screens: {
              slug: {
                path: '*slug',
                exact: true,
              },
            },
          },
          Baz: {},
        },
      },
    },
  };

  const state = {
    routes: [
      {
        name: 'Foo',
        params: {
          slug: ['whatever'],
        },
        state: {
          routes: [
            {
              name: 'Bar',
              params: {
                slug: ['whatever'],
              },
              state: {
                routes: [
                  {
                    name: 'slug',
                    params: {
                      slug: ['whatever'],
                    },
                    path,
                  },
                ],
              },
            },
          ],
        },
      },
    ],
  };

  expect(getStateFromPath<object>(path, config)).toEqual(state);
  expect(getStateFromPath<object>(getPathFromState<object>(state, config), config)).toEqual(
    changePath(state, path)
  );
});

it('tries to match wildcard patterns at the end', () => {
  const path = '/bar/42/test';
  const config = {
    screens: {
      bar: {
        path: 'bar',
        screens: {
          '[...slug]': '*slug',
          '[userSlug]': ':userSlug',
          ':id': {
            path: ':id',
            screens: {
              test: 'test',
            },
          },
        },
      },
    },
  };

  const state = {
    routes: [
      {
        name: 'bar',
        params: { id: '42' },
        state: {
          routes: [
            {
              name: ':id',
              params: { id: '42' },
              state: {
                routes: [
                  {
                    name: 'test',
                    params: { id: '42' },
                    path: '/bar/42/test',
                  },
                ],
              },
            },
          ],
        },
      },
    ],
  };

  testConversions(path, config, state);
});

it('uses nearest parent wildcard match for unmatched paths', () => {
  const path = '/bar/42/baz/test';
  const config = {
    screens: {
      Foo: {
        screens: {
          Bar: {
            path: '/bar/:id/',
            screens: {
              Baz: 'baz',
            },
          },
          '[...slug]': '*slug',
        },
      },
    },
  };

  const state = {
    routes: [
      {
        name: 'Foo',
        params: {
          slug: ['bar', '42', 'baz', 'test'],
        },
        state: {
          routes: [
            {
              name: '[...slug]',
              params: {
                slug: ['bar', '42', 'baz', 'test'],
              },
              path,
            },
          ],
        },
      },
    ],
  };

  testConversions(path, config, state);
});

it('throws if two screens map to the same pattern', () => {
  const path = '/bar/42/baz/test';

  expect(() =>
    getStateFromPath<object>(path, {
      screens: {
        Foo: {
          screens: {
            Bar: {
              path: '/bar/:id/',
              screens: {
                Baz: 'baz',
              },
            },
            Bax: '/bar/:id/baz',
          },
        },
      },
    })
  ).toThrow(
    "The route pattern 'bar/:id/baz' resolves to both 'Foo//bar/:id/baz' and 'Foo/Bar/baz'. Patterns must be unique and cannot resolve to more than one route."
  );

  expect(() =>
    getStateFromPath<object>(path, {
      screens: {
        Foo: {
          screens: {
            Bar: {
              path: '/bar/:id/',
              screens: {
                Baz: '',
              },
            },
          },
        },
      },
    })
  ).not.toThrow();
});

it('correctly applies initialRouteName for config with similar route names', () => {
  const path = '/weekly-earnings';

  const config = {
    screens: {
      RootTabs: {
        screens: {
          HomeTab: {
            screens: {
              Home: '',
              WeeklyEarnings: 'weekly-earnings',
              EventDetails: 'event-details/:eventId',
            },
          },
          EarningsTab: {
            initialRouteName: 'Earnings',
            path: 'earnings',
            screens: {
              Earnings: '',
              WeeklyEarnings: 'weekly-earnings',
            },
          },
        },
      },
    },
  };

  const state = {
    routes: [
      {
        name: 'RootTabs',
        state: {
          routes: [
            {
              name: 'HomeTab',
              state: {
                routes: [
                  {
                    name: 'WeeklyEarnings',
                    path,
                  },
                ],
              },
            },
          ],
        },
      },
    ],
  };

  testConversions(path, config, state);
});

it('correctly applies initialRouteName for config with similar route names v2', () => {
  const path = '/earnings/weekly-earnings';

  const config = {
    screens: {
      RootTabs: {
        screens: {
          HomeTab: {
            initialRouteName: 'Home',
            screens: {
              Home: '',
              WeeklyEarnings: 'weekly-earnings',
            },
          },
          EarningsTab: {
            initialRouteName: 'Earnings',
            path: 'earnings',
            screens: {
              Earnings: '',
              WeeklyEarnings: 'weekly-earnings',
            },
          },
        },
      },
    },
  };

  const state = {
    routes: [
      {
        name: 'RootTabs',
        state: {
          routes: [
            {
              name: 'EarningsTab',
              state: {
                index: 1,
                routes: [
                  {
                    name: 'Earnings',
                  },
                  {
                    name: 'WeeklyEarnings',
                    path,
                  },
                ],
              },
            },
          ],
        },
      },
    ],
  };

  testConversions(path, config, state);
});

it('throws when invalid properties are specified in the config', () => {
  expect(() =>
    getStateFromPath<object>('', {
      Foo: 'foo',
      Bar: {
        path: 'bar',
      },
    } as any)
  ).toThrowErrorMatchingInlineSnapshot(`
    "Found invalid properties in the configuration:
    - Foo
    - Bar

    Did you forget to specify them under a 'screens' property?

    You can only specify the following properties:
    - initialRouteName
    - screens
    - _route

    See https://reactnavigation.org/docs/configuring-links for more details on how to specify a linking configuration."
  `);

  expect(() =>
    getStateFromPath<object>('', {
      screens: {
        Foo: 'foo',
        Bar: {
          path: 'bar',
        },
        Baz: {
          Qux: {
            path: 'qux',
          },
        },
      },
    } as any)
  ).toThrowErrorMatchingInlineSnapshot(`
    "Found invalid properties in the configuration:
    - Qux

    Did you forget to specify them under a 'screens' property?

    You can only specify the following properties:
    - initialRouteName
    - screens
    - _route
    - path
    - exact
    - stringify
    - parse

    See https://reactnavigation.org/docs/configuring-links for more details on how to specify a linking configuration."
  `);
});

function testConversions(path: string, config: any, state: any) {
  expect(getStateFromPath<object>(path, config)).toEqual(state);
  expect(getStateFromPath<object>(getPathFromState<object>(state, config), config)).toEqual(state);
}
