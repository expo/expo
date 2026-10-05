import { INTERNAL_EXPO_ROUTER_NO_ANIMATION_PARAM_NAME } from '../../navigationParams';
import { getPathFromState, getPathDataFromState, type Options } from '../getPathFromState';
import { appendQueryAndHash } from '../getPathFromState-forks';
import { getStateFromPath } from '../getStateFromPath';

it(`serializes screen and object params instead of treating them as nested state`, () => {
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

  expect(getPathFromState(state, config as Options<object>)).toBe(
    '/?screen=foo&params=%5Bobject+Object%5D'
  );
});

it('serializes screen as a query param for non-group routes without nested state', () => {
  const state = {
    routes: [{ name: 'root', params: { screen: 'child' } }],
  };
  const config = {
    screens: {
      root: {
        path: 'root',
        screens: {
          child: 'child',
        },
      },
    },
  };

  expect(getPathFromState(state, config)).toBe('/root?screen=child');
});

it('does not hoist screen from an ancestor route into focused query params', () => {
  const state = {
    routes: [
      {
        name: 'root',
        params: { screen: 'child' },
        state: { routes: [{ name: 'child' }] },
      },
    ],
  };
  const config = {
    screens: {
      root: {
        path: 'root',
        screens: {
          child: 'child',
        },
      },
    },
  };

  expect(getPathFromState(state, config)).toBe('/root/child');
});

it('does not implicitly select a child for group routes without nested state', () => {
  const state = { routes: [{ name: '(group)' }] };
  const config = {
    screens: {
      '(group)': {
        screens: {
          index: 'index',
          other: 'other',
        },
      },
    },
  };

  expect(getPathFromState(state, config)).toBe('/');
});

it('does not implicitly select a child for non-group routes without nested state', () => {
  const state = {
    routes: [{ name: 'root' }],
  };
  const config = {
    screens: {
      root: {
        path: 'root',
        screens: {
          index: 'child',
        },
      },
    },
  };

  expect(getPathFromState(state, config)).toBe('/root');
});

it('collapses a trailing group segment to an empty string even when initialRouteName is set', () => {
  const state = { routes: [{ name: '(tabs)' }] };
  const config = {
    screens: {
      '(tabs)': { path: '(tabs)', initialRouteName: 'home' },
    },
  };

  expect(getPathFromState(state, config)).toBe('/');
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
      routeKeySeq: 0,
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
      routeKeySeq: 0,
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

describe('canonical query serialization', () => {
  const config = { screens: { index: '' } };

  it('round-trips canonical query characters without changing key or array order', () => {
    const params = Object.freeze({
      'space key': 'a b',
      plus: '+',
      symbols: '*~',
      unicode: 'café 😀',
      delimiters: '&=#/?',
      array: Object.freeze(['second value', 'first+value']),
    });
    const path = getPathFromState({ routes: [{ name: 'index', params }] }, config);

    expect(path).toBe(
      '/?space+key=a+b&plus=%2B&symbols=*%7E&unicode=caf%C3%A9+%F0%9F%98%80&delimiters=%26%3D%23%2F%3F&array=second+value&array=first%2Bvalue'
    );
    expect(getStateFromPath(path, config)?.routes[0]!.params).toEqual(params);
  });

  it('preserves configured normalization and omits empty arrays and undefined properties', () => {
    const params = Object.freeze({
      empty: '',
      omitted: undefined,
      emptyArray: Object.freeze([]),
      nullValue: null,
      mixed: Object.freeze([null, undefined, '', false, 0]),
      object: Object.freeze({ value: 1 }),
      boolean: false,
      number: 0,
      literalUndefined: 'undefined',
      [INTERNAL_EXPO_ROUTER_NO_ANIMATION_PARAM_NAME]: true,
    });
    const path = getPathFromState({ routes: [{ name: 'index', params }] }, config);

    expect(path).toBe(
      '/?empty=&nullValue=null&mixed=null&mixed=undefined&mixed=&mixed=false&mixed=0&object=%5Bobject+Object%5D&boolean=false&number=0'
    );
    expect(getStateFromPath(path, config)?.routes[0]!.params).toEqual({
      empty: '',
      nullValue: 'null',
      mixed: ['null', 'undefined', '', 'false', '0'],
      object: '[object Object]',
      boolean: 'false',
      number: '0',
    });
  });

  it('applies custom stringify before query encoding and keeps dynamic path encoding', () => {
    const config = {
      screens: {
        '[id]': {
          path: ':id',
          stringify: { custom: (value: number) => `value ${value}+*~` },
        },
      },
    };
    const path = getPathFromState(
      { routes: [{ name: '[id]', params: { id: 'path space', custom: 42 } }] },
      config
    );

    expect(path).toBe('/path%20space?custom=value+42%2B*%7E');
    expect(getStateFromPath(path, config)?.routes[0]!.params).toEqual({
      id: 'path space',
      custom: 'value 42+*~',
    });
  });

  it.each([undefined, { screens: { other: 'other' } }])(
    'preserves raw fallback values and input without populating allParams (%j)',
    (config) => {
      const params = Object.freeze({
        nullValue: null,
        omitted: undefined,
        emptyArray: Object.freeze([]),
        mixed: Object.freeze([undefined, null, '', 'a b', false, 0]),
        onlyUndefined: Object.freeze([undefined]),
        object: Object.freeze({ value: 1 }),
        literalUndefined: 'undefined',
        '#': 'ignored hash',
        [INTERNAL_EXPO_ROUTER_NO_ANIMATION_PARAM_NAME]: true,
      });
      const state = { routes: [{ name: 'raw route', params }] };
      const result = getPathDataFromState(state, config);

      expect(result).toEqual({
        path: '/raw%20route?nullValue=&mixed=&mixed=&mixed=a+b&mixed=false&mixed=0&object=%5Bobject+Object%5D',
        params: {},
      });
      expect(getStateFromPath(result.path)?.routes[0]!.params).toEqual({
        nullValue: '',
        mixed: ['', '', 'a b', 'false', '0'],
        object: '[object Object]',
      });
      expect(state.routes[0]!.params).toBe(params);
      expect(params.mixed).toEqual([undefined, null, '', 'a b', false, 0]);
      expect(params['#']).toBe('ignored hash');
    }
  );

  it.each(['', 'already%20encoded', 'hash space+*~'])('keeps hash text separate (%j)', (hash) => {
    const params = Object.freeze({ query: 'a b+*~', '#': hash });
    const expected = `/?query=a+b%2B*%7E${hash ? `#${hash}` : ''}`;

    expect(getPathFromState({ routes: [{ name: 'index', params }] }, config)).toBe(expected);
    expect(appendQueryAndHash('/', params)).toBe(expected);
  });

  it('appends repeated query values before the hash without mutating params', () => {
    const params = Object.freeze({
      z: ['two words', '+'],
      a: '',
      empty: [],
      '#': 'hash space+',
    });

    expect(appendQueryAndHash('/nested/path', params)).toBe(
      '/nested/path?z=two+words&z=%2B&a=#hash space+'
    );
    expect(params).toEqual({ z: ['two words', '+'], a: '', empty: [], '#': 'hash space+' });
  });
});
