import { expect, test } from '@jest/globals';
import type { NavigationState, PartialState } from '@react-navigation/routers';

import { getPathFromState } from '../getPathFromState';
import { getStateFromPath } from '../getStateFromPath';

type State = PartialState<NavigationState>;

test('converts state to path string', () => {
  const state = {
    routes: [
      {
        name: 'foo',
        state: {
          index: 1,
          routes: [
            { name: 'boo' },
            {
              name: 'bar',
              params: { fruit: 'apple' },
              state: {
                routes: [
                  {
                    name: 'baz qux',
                    params: { author: 'jane', valid: true },
                  },
                ],
              },
            },
          ],
        },
      },
    ],
  };

  const path = '/foo/bar/baz%20qux?author=jane&valid=true';

  expect(getPathFromState<object>(state)).toBe(path);
  expect(getPathFromState<object>(getStateFromPath<object>(path) as State)).toBe(path);
});

test('converts state to path string with config', () => {
  const path = '/few/bar/sweet/apple/baz/jane?id=x10&valid=true';
  const config = {
    screens: {
      Foo: {
        path: 'few',
        screens: {
          Bar: {
            path: 'bar/:type/:fruit',
            screens: {
              Baz: {
                path: 'baz/:author',
                parse: {
                  author: (author: string) => author.replace(/^\w/, (c) => c.toUpperCase()),
                  id: (id: string) => Number(id.replace(/^x/, '')),
                  valid: Boolean,
                },
                stringify: {
                  author: (author: string) => author.toLowerCase(),
                  id: (id: number) => `x${id}`,
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
        state: {
          index: 1,
          routes: [
            { name: 'boo' },
            {
              name: 'Bar',
              params: { fruit: 'apple', type: 'sweet', avaliable: false },
              state: {
                routes: [
                  {
                    name: 'Baz',
                    params: {
                      author: 'Jane',
                      id: 10,
                      valid: true,
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

  expect(getPathFromState<object>(state, config)).toBe(path);
  expect(getPathFromState<object>(getStateFromPath<object>(path, config) as State, config)).toBe(
    path
  );
});

test('handles route without param', () => {
  const path = '/foo/bar';
  const state = {
    routes: [
      {
        name: 'foo',
        state: {
          routes: [{ name: 'bar' }],
        },
      },
    ],
  };

  expect(getPathFromState<object>(state)).toBe(path);
  expect(getPathFromState<object>(getStateFromPath<object>(path) as State)).toBe(path);
});

test("doesn't add query param for empty params", () => {
  const path = '/foo';
  const state = {
    routes: [
      {
        name: 'foo',
        params: {},
      },
    ],
  };

  expect(getPathFromState<object>(state)).toBe(path);
  expect(getPathFromState<object>(getStateFromPath<object>(path) as State)).toBe(path);
});

test('handles state with config with nested screens', () => {
  const path = '/foo/foe/bar/sweet/apple/baz/jane?answer=42&count=10&valid=true';
  const config = {
    screens: {
      Foo: {
        path: 'foo',
        screens: {
          Foe: {
            path: 'foe',
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
                      id: (id: number) => `x${id}`,
                      unknown: (_: unknown) => 'x',
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
        state: {
          routes: [
            {
              name: 'Foe',
              state: {
                routes: [
                  {
                    name: 'Bar',
                    params: { fruit: 'apple', type: 'sweet' },
                    state: {
                      routes: [
                        {
                          name: 'Baz',
                          params: {
                            answer: '42',
                            author: 'Jane',
                            count: '10',
                            valid: true,
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

  expect(getPathFromState<object>(state, config)).toBe(path);
  expect(getPathFromState<object>(getStateFromPath<object>(path, config) as State, config)).toBe(
    path
  );
});

test('handles state with config with nested screens and exact', () => {
  const path = '/foe/bar/sweet/apple/baz/jane?answer=42&count=10&valid=true';
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
                      id: (id: number) => `x${id}`,
                      unknown: (_: unknown) => 'x',
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
        state: {
          routes: [
            {
              name: 'Foe',
              state: {
                routes: [
                  {
                    name: 'Bar',
                    params: { fruit: 'apple', type: 'sweet' },
                    state: {
                      routes: [
                        {
                          name: 'Baz',
                          params: {
                            answer: '42',
                            author: 'Jane',
                            count: '10',
                            valid: true,
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

  expect(getPathFromState<object>(state, config)).toBe(path);
  expect(getPathFromState<object>(getStateFromPath<object>(path, config) as State, config)).toBe(
    path
  );
});

test('handles state with config with nested screens and unused configs', () => {
  const path = '/foo/foe/baz/jane?answer=42&count=10&valid=true';
  const config = {
    screens: {
      Foo: {
        path: 'foo',
        screens: {
          Foe: {
            path: 'foe',
            screens: {
              Baz: {
                path: 'baz/:author',
                parse: {
                  author: (author: string) => author.replace(/^\w/, (c) => c.toUpperCase()),
                  count: Number,
                  valid: Boolean,
                },
                stringify: {
                  author: (author: string) => author.replace(/^\w/, (c) => c.toLowerCase()),
                  unknown: (_: unknown) => 'x',
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
        state: {
          routes: [
            {
              name: 'Foe',
              state: {
                routes: [
                  {
                    name: 'Baz',
                    params: {
                      answer: '42',
                      author: 'Jane',
                      count: 10,
                      valid: true,
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

  expect(getPathFromState<object>(state, config)).toBe(path);
  expect(getPathFromState<object>(getStateFromPath<object>(path, config) as State, config)).toBe(
    path
  );
});

test('handles state with config with nested screens and unused configs with exact', () => {
  const path = '/foe/baz/jane?answer=42&count=10&valid=true';
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
                },
                stringify: {
                  author: (author: string) => author.replace(/^\w/, (c) => c.toLowerCase()),
                  unknown: (_: unknown) => 'x',
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
        state: {
          routes: [
            {
              name: 'Foe',
              state: {
                routes: [
                  {
                    name: 'Baz',
                    params: {
                      answer: '42',
                      author: 'Jane',
                      count: 10,
                      valid: true,
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

  expect(getPathFromState<object>(state, config)).toBe(path);
  expect(getPathFromState<object>(getStateFromPath<object>(path, config) as State, config)).toBe(
    path
  );
});

test('handles nested object with stringify in it', () => {
  const path = '/bar/sweet/apple/foo/bis/jane?answer=42&count=10&valid=true';
  const config = {
    screens: {
      Bar: {
        path: 'bar/:type/:fruit',
        screens: {
          Foo: {
            path: 'foo',
            screens: {
              Foe: {
                path: 'foe',
              },
              Baz: {
                screens: {
                  Bos: 'bos',
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
  };

  const state = {
    routes: [
      {
        name: 'Bar',
        params: { fruit: 'apple', type: 'sweet' },
        state: {
          routes: [
            {
              name: 'Foo',
              state: {
                routes: [
                  {
                    name: 'Baz',
                    state: {
                      routes: [
                        {
                          name: 'Bis',
                          params: {
                            answer: '42',
                            author: 'Jane',
                            count: 10,
                            valid: true,
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

  expect(getPathFromState<object>(state, config)).toBe(path);
  expect(getPathFromState<object>(getStateFromPath<object>(path, config) as State, config)).toBe(
    path
  );
});

test('handles nested object with stringify in it with exact', () => {
  const path = '/bis/jane?answer=42&count=10&valid=true';
  const config = {
    screens: {
      Bar: {
        path: 'bar/:type/:fruit',
        screens: {
          Foo: {
            path: 'foo',
            screens: {
              Foe: {
                path: 'foe',
              },
              Baz: {
                path: 'baz',
                screens: {
                  Bos: 'bos',
                  Bis: {
                    path: 'bis/:author',
                    exact: true,
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
  };

  const state = {
    routes: [
      {
        name: 'Bar',
        params: { fruit: 'apple', type: 'sweet' },
        state: {
          routes: [
            {
              name: 'Foo',
              state: {
                routes: [
                  {
                    name: 'Baz',
                    state: {
                      routes: [
                        {
                          name: 'Bis',
                          params: {
                            answer: '42',
                            author: 'Jane',
                            count: 10,
                            valid: true,
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

  expect(getPathFromState<object>(state, config)).toBe(path);
  expect(getPathFromState<object>(getStateFromPath<object>(path, config) as State, config)).toBe(
    path
  );
});

test('handles nested object for second route depth', () => {
  const path = '/foo/bar/baz';
  const config = {
    screens: {
      Foo: {
        path: 'foo',
        screens: {
          Foe: 'foe',
          Bar: {
            path: 'bar',
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
          routes: [
            {
              name: 'Bar',
              state: {
                routes: [{ name: 'Baz' }],
              },
            },
          ],
        },
      },
    ],
  };

  expect(getPathFromState<object>(state, config)).toBe(path);
  expect(getPathFromState<object>(getStateFromPath<object>(path, config) as State, config)).toBe(
    path
  );
});

test('handles nested object for second route depth with exact', () => {
  const path = '/baz';
  const config = {
    screens: {
      Foo: {
        path: 'foo',
        screens: {
          Foe: 'foe',
          Bar: {
            path: 'bar',
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
                routes: [{ name: 'Baz' }],
              },
            },
          ],
        },
      },
    ],
  };

  expect(getPathFromState<object>(state, config)).toBe(path);
  expect(getPathFromState<object>(getStateFromPath<object>(path, config) as State, config)).toBe(
    path
  );
});

test('handles nested object for second route depth and path and stringify in roots', () => {
  const path = '/foo/dathomir/bar/42/baz';
  const config = {
    screens: {
      Foo: {
        path: 'foo/:planet',
        stringify: {
          id: (id: number) => `planet=${id}`,
        },
        screens: {
          Foe: 'foe',
          Bar: {
            path: 'bar/:id',
            parse: {
              id: Number,
            },
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
        params: { planet: 'dathomir' },
        state: {
          routes: [
            {
              name: 'Bar',
              state: {
                routes: [{ name: 'Baz', params: { id: 42 } }],
              },
            },
          ],
        },
      },
    ],
  };

  expect(getPathFromState<object>(state, config)).toBe(path);
  expect(getPathFromState<object>(getStateFromPath<object>(path, config) as State, config)).toBe(
    path
  );
});

test('handles nested object for second route depth and path and stringify in roots with exact', () => {
  const path = '/baz';
  const config = {
    screens: {
      Foo: {
        path: 'foo/:id',
        stringify: {
          id: (id: number) => `id=${id}`,
        },
        screens: {
          Foe: 'foe',
          Bar: {
            path: 'bar/:id',
            stringify: {
              id: (id: number) => `id=${id}`,
            },
            parse: {
              id: Number,
            },
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
                routes: [{ name: 'Baz' }],
              },
            },
          ],
        },
      },
    ],
  };

  expect(getPathFromState<object>(state, config)).toBe(path);
  expect(getPathFromState<object>(getStateFromPath<object>(path, config) as State, config)).toBe(
    path
  );
});

test('ignores empty string paths', () => {
  const path = '/bar';
  const config = {
    screens: {
      Foo: {
        path: '',
        screens: {
          Foe: 'foe',
        },
      },
      Bar: 'bar',
    },
  };

  const state = {
    routes: [
      {
        name: 'Foo',
        state: {
          routes: [{ name: 'Bar' }],
        },
      },
    ],
  };

  expect(getPathFromState<object>(state, config)).toBe(path);
  expect(getPathFromState<object>(getStateFromPath<object>(path, config) as State, config)).toBe(
    path
  );
});

test('keeps query params if path is empty', () => {
  const path = '/?foo=42';
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
                routes: [{ name: 'Qux', params: { foo: 42 } }],
              },
            },
          ],
        },
      },
    ],
  };

  expect(getPathFromState<object>(state, config)).toBe(path);
  expect(getPathFromState<object>(getStateFromPath<object>(path, config) as State, config)).toEqual(
    path
  );
});

test('does not use Object.prototype properties as parsing functions', () => {
  const path = '/?toString=42';
  const config = {
    screens: {
      Foo: {
        screens: {
          Foe: 'foe',
          Bar: {
            screens: {
              Qux: {
                path: '',
                parse: {},
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
                routes: [{ name: 'Qux', params: { toString: 42 } }],
              },
            },
          ],
        },
      },
    ],
  };

  expect(getPathFromState<object>(state, config)).toBe(path);
  expect(getPathFromState<object>(getStateFromPath<object>(path, config) as State, config)).toEqual(
    path
  );
});

test('cuts nested configs too', () => {
  const path = '/foo/baz';
  const config = {
    screens: {
      Foo: {
        path: 'foo',
        screens: {
          Bar: {
            path: '',
            screens: {
              Baz: {
                path: 'baz',
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
                routes: [{ name: 'Baz' }],
              },
            },
          ],
        },
      },
    ],
  };

  expect(getPathFromState<object>(state, config)).toBe(path);
  expect(getPathFromState<object>(getStateFromPath<object>(path, config) as State, config)).toBe(
    path
  );
});

test('cuts nested configs too with exact', () => {
  const path = '/baz';
  const config = {
    screens: {
      Foo: {
        path: 'foo',
        screens: {
          Bar: {
            path: '',
            exact: true,
            screens: {
              Baz: {
                path: 'baz',
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
                routes: [{ name: 'Baz' }],
              },
            },
          ],
        },
      },
    ],
  };

  expect(getPathFromState<object>(state, config)).toBe(path);
  expect(getPathFromState<object>(getStateFromPath<object>(path, config) as State, config)).toBe(
    path
  );
});

test('handles empty path at the end', () => {
  const path = '/foo/bar';
  const config = {
    screens: {
      Foo: {
        path: 'foo',
        screens: {
          Bar: 'bar',
        },
      },
      Baz: { path: '' },
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
                routes: [{ name: 'Baz' }],
              },
            },
          ],
        },
      },
    ],
  };

  expect(getPathFromState<object>(state, config)).toBe(path);
  expect(getPathFromState<object>(getStateFromPath<object>(path, config) as State, config)).toBe(
    path
  );
});

test('returns "/" for empty path', () => {
  const path = '/';

  const config = {
    screens: {
      Foo: {
        path: '',
        screens: {
          Bar: '',
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
            },
          ],
        },
      },
    ],
  };

  expect(getPathFromState<object>(state, config)).toBe(path);
  expect(getPathFromState<object>(getStateFromPath<object>(path, config) as State, config)).toBe(
    path
  );
});

test('parses no path specified', () => {
  const path = '/bar';
  const config = {
    screens: {
      Foo: {
        screens: {
          Foe: {},
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
          routes: [{ name: 'Bar' }],
        },
      },
    ],
  };

  expect(getPathFromState<object>(state, config)).toBe(path);
  expect(getPathFromState<object>(getStateFromPath<object>(path, config) as State, config)).toBe(
    path
  );
});

test('strips undefined query params', () => {
  const path = '/bar/sweet/apple/foo/bis/jane?count=10&valid=true';
  const config = {
    screens: {
      Bar: {
        path: 'bar/:type/:fruit',
        screens: {
          Foo: {
            path: 'foo',
            screens: {
              Foe: {
                path: 'foe',
              },
              Baz: {
                screens: {
                  Bos: 'bos',
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
  };

  const state = {
    routes: [
      {
        name: 'Bar',
        params: { fruit: 'apple', type: 'sweet' },
        state: {
          routes: [
            {
              name: 'Foo',
              state: {
                routes: [
                  {
                    name: 'Baz',
                    state: {
                      routes: [
                        {
                          name: 'Bis',
                          params: {
                            author: 'Jane',
                            count: 10,
                            valid: true,
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

  expect(getPathFromState<object>(state, config)).toBe(path);
  expect(getPathFromState<object>(getStateFromPath<object>(path, config) as State, config)).toBe(
    path
  );
});

test('strips undefined query params with exact', () => {
  const path = '/bis/jane?count=10&valid=true';
  const config = {
    screens: {
      Bar: {
        path: 'bar/:type/:fruit',
        screens: {
          Foo: {
            path: 'foo',
            screens: {
              Foe: {
                path: 'foe',
              },
              Baz: {
                screens: {
                  Bos: 'bos',
                  Bis: {
                    path: 'bis/:author',
                    exact: true,
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
  };

  const state = {
    routes: [
      {
        name: 'Bar',
        params: { fruit: 'apple', type: 'sweet' },
        state: {
          routes: [
            {
              name: 'Foo',
              state: {
                routes: [
                  {
                    name: 'Baz',
                    state: {
                      routes: [
                        {
                          name: 'Bis',
                          params: {
                            author: 'Jane',
                            count: 10,
                            valid: true,
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

  expect(getPathFromState<object>(state, config)).toBe(path);
  expect(getPathFromState<object>(getStateFromPath<object>(path, config) as State, config)).toBe(
    path
  );
});

test('handles stripping all query params', () => {
  const path = '/bar/sweet/apple/foo/bis/jane';
  const config = {
    screens: {
      Bar: {
        path: 'bar/:type/:fruit',
        screens: {
          Foo: {
            path: 'foo',
            screens: {
              Foe: {
                path: 'foe',
              },
              Baz: {
                screens: {
                  Bos: 'bos',
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
  };

  const state = {
    routes: [
      {
        name: 'Bar',
        params: { fruit: 'apple', type: 'sweet' },
        state: {
          routes: [
            {
              name: 'Foo',
              state: {
                routes: [
                  {
                    name: 'Baz',
                    state: {
                      routes: [
                        {
                          name: 'Bis',
                          params: {
                            author: 'Jane',
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

  expect(getPathFromState<object>(state, config)).toBe(path);
  expect(getPathFromState<object>(getStateFromPath<object>(path, config) as State, config)).toBe(
    path
  );
});

test('handles stripping all query params with exact', () => {
  const path = '/bis/jane';
  const config = {
    screens: {
      Bar: {
        path: 'bar/:type/:fruit',
        screens: {
          Foo: {
            path: 'foo',
            screens: {
              Foe: {
                path: 'foe',
              },
              Baz: {
                path: 'baz',
                screens: {
                  Bos: 'bos',
                  Bis: {
                    path: 'bis/:author',
                    exact: true,
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
  };

  const state = {
    routes: [
      {
        name: 'Bar',
        params: { fruit: 'apple', type: 'sweet' },
        state: {
          routes: [
            {
              name: 'Foo',
              state: {
                routes: [
                  {
                    name: 'Baz',
                    state: {
                      routes: [
                        {
                          name: 'Bis',
                          params: {
                            author: 'Jane',
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

  expect(getPathFromState<object>(state, config)).toBe(path);
  expect(getPathFromState<object>(getStateFromPath<object>(path, config) as State, config)).toBe(
    path
  );
});

test('replaces undefined query params', () => {
  const path = '/bar/undefined/apple';
  const config = {
    screens: {
      Bar: 'bar/:type/:fruit',
    },
  };

  const state = {
    routes: [
      {
        name: 'Bar',
        params: { fruit: 'apple' },
      },
    ],
  };

  expect(getPathFromState<object>(state, config)).toBe(path);
  expect(getPathFromState<object>(getStateFromPath<object>(path, config) as State, config)).toBe(
    path
  );
});

test('matches wildcard patterns at root', () => {
  const path = '/test/bar/42/whatever';
  const config = {
    screens: {
      404: '*',
      Foo: {
        screens: {
          Bar: {
            path: '/bar/:id/',
          },
        },
      },
    },
  };

  const state = {
    routes: [{ name: '404' }],
  };

  expect(getPathFromState<object>(state, config)).toBe('/404');
  expect(getPathFromState<object>(getStateFromPath<object>(path, config) as State, config)).toBe(
    '/404'
  );
});

test('matches wildcard patterns at nested level', () => {
  const path = '/bar/42/whatever/baz/initt';
  const config = {
    screens: {
      Foo: {
        screens: {
          Bar: {
            path: '/bar/:id/',
            screens: {
              404: '*',
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
              params: { id: '42' },
              state: {
                routes: [{ name: '404' }],
              },
            },
          ],
        },
      },
    ],
  };

  expect(getPathFromState<object>(state, config)).toBe('/bar/42/404');
  expect(getPathFromState<object>(getStateFromPath<object>(path, config) as State, config)).toBe(
    '/bar/42/404'
  );
});

test('matches wildcard patterns at nested level with exact', () => {
  const path = '/whatever';
  const config = {
    screens: {
      Foo: {
        screens: {
          Bar: {
            path: '/bar/:id/',
            screens: {
              404: {
                path: '*',
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
        state: {
          routes: [
            {
              name: 'Bar',
              state: {
                routes: [{ name: '404' }],
              },
            },
          ],
        },
      },
    ],
  };

  expect(getPathFromState<object>(state, config)).toBe('/404');
  expect(getPathFromState<object>(getStateFromPath<object>(path, config) as State, config)).toBe(
    '/404'
  );
});

test('tries to match wildcard patterns at the end', () => {
  const path = '/bar/42/test';
  const config = {
    screens: {
      Foo: {
        screens: {
          Bar: {
            path: '/bar/:id/',
            screens: {
              404: '*',
              Test: 'test',
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
              params: { id: '42' },
              state: {
                routes: [{ name: 'Test' }],
              },
            },
          ],
        },
      },
    ],
  };

  expect(getPathFromState<object>(state, config)).toBe(path);
  expect(getPathFromState<object>(getStateFromPath<object>(path, config) as State, config)).toBe(
    path
  );
});

test('uses nearest parent wildcard match for unmatched paths', () => {
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
          404: '*',
        },
      },
    },
  };

  const state = {
    routes: [
      {
        name: 'Foo',
        state: {
          routes: [{ name: '404' }],
        },
      },
    ],
  };

  expect(getPathFromState<object>(state, config)).toBe('/404');
  expect(getPathFromState<object>(getStateFromPath<object>(path, config) as State, config)).toBe(
    '/404'
  );
});

test('handles path at top level', () => {
  const path = 'foo/fruits/apple';
  const config = {
    path: 'foo',
    screens: {
      Foo: {
        screens: {
          Fruits: 'fruits/:fruit',
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
              name: 'Fruits',
              params: { fruit: 'apple' },
            },
          ],
        },
      },
    ],
  };

  expect(getPathFromState<object>(state, config)).toEqual(path);
  expect(getPathFromState<object>(getStateFromPath<object>(path, config)!, config)).toEqual(path);
});
