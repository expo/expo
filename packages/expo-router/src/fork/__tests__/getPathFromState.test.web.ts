import { getPathFromState, getPathDataFromState, type Options } from '../getPathFromState';

it(`handles nested params.screen/params.params for dynamic routes`, () => {
  const state = {
    routes: [
      {
        name: '(group)',
        params: {
          screen: 'foo',
          params: {
            screen: '[id]/index',
            params: { id: 'bar' },
          },
        },
      },
    ],
  };

  const config = {
    screens: {
      '(group)': {
        screens: {
          foo: {
            screens: {
              index: '(group)/foo',
              '[id]/index': '(group)/foo/:id',
            },
          },
        },
      },
    },
  };

  expect(getPathFromState(state, config as Options<object>)).toBe('/foo/bar');
});

describe('hash support', () => {
  it('appends hash to the path', () => {
    const state = {
      index: 0,
      key: 'key',
      routes: [
        {
          name: 'index',
          path: '/',
          params: {
            '#': 'hash1',
          },
        },
      ],
      stale: true,
      type: 'stack',
    };

    const config = {
      screens: {
        index: '',
        _sitemap: '_sitemap',
      },
    };

    expect(getPathFromState(state, config)).toBe('/#hash1');
  });

  it('works with nested state, existing router and path params', () => {
    const state = {
      index: 1,
      key: 'key',
      routeNames: ['index', '[test]'],
      routes: [
        {
          key: 'key',
          name: 'index',
          params: undefined,
          path: '/',
        },
        {
          key: 'key',
          name: '[test]',
          params: {
            test: 'hello-world',
            query: 'true',
            '#': 'a',
          },
          path: undefined,
        },
      ],
      stale: false,
      type: 'stack',
    };

    const config = {
      screens: {
        '[test]': ':test',
        index: '',
        _sitemap: '_sitemap',
      },
    };

    expect(getPathFromState(state, config)).toBe('/hello-world?query=true#a');
  });
});

it(`handles url search params params`, () => {
  const state = {
    routes: [
      {
        name: 'index',
        params: {
          test: 'true',
          hello: 'world',
          array: ['1', '2'],
        },
        path: '/?test=true&hello=world&array=1&array=2',
      },
    ],
  };

  const config = {
    screens: {
      index: '',
      _sitemap: '_sitemap',
    },
  };

  expect(getPathFromState(state, config)).toBe('/?test=true&hello=world&array=1&array=2');
});

describe('state mutation safety', () => {
  it('does not mutate input state params when focusedParams falls back to focusedRoute.params', () => {
    const originalParams = {
      test: 'hello-world',
      query: 'true',
      '#': 'myhash',
    };

    const state = {
      index: 0,
      key: 'key',
      routes: [
        {
          key: 'key',
          name: '[test]',
          params: { ...originalParams },
          path: undefined,
        },
      ],
      stale: false,
      type: 'stack',
    };

    const config = {
      screens: {
        '[test]': ':test',
        index: '',
        _sitemap: '_sitemap',
      },
    };

    const paramsBefore = { ...state.routes[0]!.params };
    getPathDataFromState(state, config);
    // The original params on the route should not have been mutated
    expect(state.routes[0]!.params).toEqual(paramsBefore);
  });
});
