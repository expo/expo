import {
  areUrlObjectsEqual,
  getRouteInfoFromState,
  defaultRouteInfo,
} from '../getRouteInfoFromState';

describe('getRouteInfoFromState', () => {
  it('returns defaultRouteInfo when state is undefined', () => {
    expect(getRouteInfoFromState(undefined)).toBe(defaultRouteInfo);
  });

  it('handles +not-found route', () => {
    const result = getRouteInfoFromState({
      routes: [{ name: '+not-found' }],
      index: 0,
    });

    expect(result.pathname).toBe('/');
    expect(result.segments).toEqual(['+not-found']);
    expect(result.pathnameWithParams).toBe('/');
  });

  it('handles +not-found route with path', () => {
    const result = getRouteInfoFromState({
      routes: [{ name: '+not-found', path: '/missing-page' }],
      index: 0,
    });

    expect(result.pathname).toBe('/missing-page');
    expect(result.segments).toEqual(['+not-found']);
  });

  it('handles _sitemap route', () => {
    const result = getRouteInfoFromState({
      routes: [{ name: '_sitemap' }],
      index: 0,
    });

    expect(result.pathname).toBe('/_sitemap');
    expect(result.segments).toEqual(['_sitemap']);
    expect(result.pathnameWithParams).toBe('/_sitemap');
  });

  it('throws when first route is not __root', () => {
    expect(() =>
      getRouteInfoFromState({
        routes: [{ name: 'not-root' }],
        index: 0,
      })
    ).toThrow('Expected the first route to be __root, but got not-root');
  });

  it('simple route: __root → (group) → home', () => {
    const result = getRouteInfoFromState({
      routes: [
        {
          name: '__root',
          state: {
            routes: [
              {
                name: '(group)',
                state: {
                  routes: [{ name: 'home' }],
                  index: 0,
                },
              },
            ],
            index: 0,
          },
        },
      ],
      index: 0,
    });

    expect(result).toEqual({
      pathname: '/home',
      segments: ['(group)', 'home'],
      params: {},
      searchParams: new URLSearchParams(),
      pathnameWithParams: '/home',
      unstable_globalHref: '/home',
      isIndex: false,
    });
  });

  it('dynamic segment: __root → [id] with params {id: "123"}', () => {
    const result = getRouteInfoFromState({
      routes: [
        {
          name: '__root',
          state: {
            routes: [{ name: '[id]', params: { id: '123' } }],
            index: 0,
          },
        },
      ],
      index: 0,
    });

    expect(result).toEqual({
      pathname: '/123',
      segments: ['[id]'],
      params: { id: '123' },
      searchParams: new URLSearchParams(),
      pathnameWithParams: '/123',
      unstable_globalHref: '/123',
      isIndex: false,
    });
  });

  it('catch-all segment: __root → [...rest] with params {rest: ["a", "b"]}', () => {
    const result = getRouteInfoFromState({
      routes: [
        {
          name: '__root',
          state: {
            routes: [{ name: '[...rest]', params: { rest: ['a', 'b'] } }],
            index: 0,
          },
        },
      ],
      index: 0,
    });

    expect(result).toEqual({
      pathname: '/a/b',
      segments: ['[...rest]'],
      params: { rest: ['a', 'b'] },
      searchParams: new URLSearchParams(),
      pathnameWithParams: '/a/b',
      unstable_globalHref: '/a/b',
      isIndex: false,
    });
  });

  it('extra params not in path become searchParams', () => {
    const result = getRouteInfoFromState({
      routes: [
        {
          name: '__root',
          state: {
            routes: [{ name: 'page', params: { q: 'hello', filter: 'active' } }],
            index: 0,
          },
        },
      ],
      index: 0,
    });

    expect(result.pathname).toBe('/page');
    expect(result.searchParams.get('q')).toBe('hello');
    expect(result.searchParams.get('filter')).toBe('active');
    expect(result.pathnameWithParams).toBe('/page?q=hello&filter=active');
  });

  // The `#` key is treated specially: it's extracted from searchParams into the hash portion
  // of pathnameWithParams, then deleted from searchParams. It IS in `params`, but not in `searchParams`.
  it('hash param is extracted into pathnameWithParams', () => {
    const result = getRouteInfoFromState({
      routes: [
        {
          name: '__root',
          state: {
            routes: [{ name: 'page', params: { '#': 'section1' } }],
            index: 0,
          },
        },
      ],
      index: 0,
    });

    expect(result.pathnameWithParams).toBe('/page#section1');
    expect(result.searchParams.has('#')).toBe(false);
    expect(result.params['#']).toBe('section1');
  });

  // File-based routing convention: `settings/index.tsx` maps to `/settings`,
  // so the trailing `index` segment is stripped to produce clean URLs.
  it('strips trailing index segment', () => {
    const result = getRouteInfoFromState({
      routes: [
        {
          name: '__root',
          state: {
            routes: [
              {
                name: 'settings',
                state: {
                  routes: [{ name: 'index' }],
                  index: 0,
                },
              },
            ],
            index: 0,
          },
        },
      ],
      index: 0,
    });

    expect(result.segments).toEqual(['settings']);
    expect(result.pathname).toBe('/settings');
  });

  it('groups are filtered from pathname but kept in segments', () => {
    const result = getRouteInfoFromState({
      routes: [
        {
          name: '__root',
          state: {
            routes: [
              {
                name: '(tabs)',
                state: {
                  routes: [{ name: 'feed' }],
                  index: 0,
                },
              },
            ],
            index: 0,
          },
        },
      ],
      index: 0,
    });

    expect(result.segments).toEqual(['(tabs)', 'feed']);
    expect(result.pathname).toBe('/feed');
  });

  // Params reach the state already decoded: `getStateFromPath()` decodes path segments and reads
  // search params through `URLSearchParams`. Anything still percent-encoded at this point is a
  // literal value the caller passed in, so it is returned unchanged.
  it('returns params without decoding them again', () => {
    const result = getRouteInfoFromState({
      routes: [
        {
          name: '__root',
          state: {
            routes: [{ name: '[name]', params: { name: 'hello%20world' } }],
            index: 0,
          },
        },
      ],
      index: 0,
    });

    expect(result.params.name).toBe('hello%20world');
    expect(result.pathname).toBe('/hello%20world');
  });

  it('handles malformed URI component (returns as-is)', () => {
    const result = getRouteInfoFromState({
      routes: [
        {
          name: '__root',
          state: {
            routes: [{ name: '[name]', params: { name: '%E0%A4%A' } }],
            index: 0,
          },
        },
      ],
      index: 0,
    });

    // Malformed URI should be returned as-is
    expect(result.params.name).toBe('%E0%A4%A');
    expect(result.pathname).toBe('/%E0%A4%A');
    expect(result.pathnameWithParams).toBe('/%E0%A4%A');
  });

  it('keeps scalar screen and drops nested params objects from search params', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const result = getRouteInfoFromState({
      routes: [
        {
          name: '__root',
          state: {
            routes: [
              {
                name: '(tabs)',
                params: {
                  screen: 'settings',
                  params: {
                    screen: 'profile',
                  },
                },
              },
            ],
            index: 0,
          },
        },
      ],
      index: 0,
    });

    expect(result.segments).toEqual(['(tabs)']);
    expect(result.pathname).toBe('/');
    expect(result.params).toEqual({
      screen: 'settings',
      params: { screen: 'profile' },
    });
    expect(result.searchParams.get('screen')).toBe('settings');
    expect(result.searchParams.has('params')).toBe(false);
    expect(result.pathnameWithParams).toBe('/?screen=settings');
    expect(warn).toHaveBeenCalledWith(
      'Navigating with nested object params is not supported. Expo Router URL params must be serializable as strings. Use flat params or serialize the object value.'
    );
    warn.mockRestore();
  });

  it('does not warn for screen params while reading route info', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const rootParams = { screen: 'root' };
    const groupParams = { screen: 'group' };
    const pageParams = { screen: 'page' };
    const state = {
      routes: [
        {
          name: '__root',
          params: rootParams,
          state: {
            routes: [
              {
                name: '(group)',
                params: groupParams,
                state: { routes: [{ name: 'page', params: pageParams }] },
              },
            ],
          },
        },
      ],
    };

    getRouteInfoFromState(state);
    getRouteInfoFromState(state);

    expect(warn).not.toHaveBeenCalled();
    warn.mockRestore();
  });

  it('warns once for each visited route params object containing an object value', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const nestedParams = { params: { id: 'one' } };
    const objectValueParams = { x: { a: 1 } };
    const state = {
      routes: [
        {
          name: '__root',
          state: {
            routes: [
              {
                name: 'layout',
                params: nestedParams,
                state: { routes: [{ name: 'page', params: objectValueParams }] },
              },
            ],
          },
        },
      ],
    };

    getRouteInfoFromState(state);
    getRouteInfoFromState(state);

    expect(warn).toHaveBeenCalledTimes(2);
    expect(warn).toHaveBeenCalledWith(
      'Navigating with nested object params is not supported. Expo Router URL params must be serializable as strings. Use flat params or serialize the object value.'
    );
    warn.mockRestore();
  });

  it('route name starting with / has leading slash stripped', () => {
    const result = getRouteInfoFromState({
      routes: [
        {
          name: '__root',
          state: {
            routes: [{ name: '/dashboard' }],
            index: 0,
          },
        },
      ],
      index: 0,
    });

    expect(result.segments).toEqual(['dashboard']);
    expect(result.pathname).toBe('/dashboard');
  });

  it('returns array params in a catch-all without decoding them again', () => {
    const result = getRouteInfoFromState({
      routes: [
        {
          name: '__root',
          state: {
            routes: [{ name: '[...path]', params: { path: ['hello%20world', 'foo%2Fbar'] } }],
            index: 0,
          },
        },
      ],
      index: 0,
    });

    expect(result.params.path).toEqual(['hello%20world', 'foo%2Fbar']);
  });

  it('uses index 0 when state has no index property', () => {
    const result = getRouteInfoFromState({
      routes: [
        {
          name: '__root',
          state: {
            routes: [{ name: 'first' }, { name: 'second' }],
          },
        },
      ],
    });

    expect(result.segments).toEqual(['first']);
  });

  it('uses non-zero index when state has index property', () => {
    const result = getRouteInfoFromState({
      routes: [
        {
          name: '__root',
          state: {
            routes: [{ name: 'first' }, { name: 'second' }],
            index: 1,
          },
        },
      ],
      index: 0,
    });

    expect(result.segments).toEqual(['second']);
    expect(result.pathname).toBe('/second');
  });

  it('uses parameters from the selected child route', () => {
    const result = getRouteInfoFromState({
      routes: [
        {
          name: '__root',
          state: {
            routes: [
              { name: 'unused' },
              {
                name: 'post/[id]',
                params: { id: '42', q: 'old' },
                state: {
                  routes: [{ name: 'unused' }, { name: 'index', params: { q: 'new' } }],
                  index: 1,
                },
              },
            ],
            index: 1,
          },
        },
      ],
    });

    expect(result.pathnameWithParams).toBe('/post/42?q=new');
  });

  it('puts the hash after query parameters', () => {
    const result = getRouteInfoFromState({
      routes: [
        {
          name: '__root',
          state: { routes: [{ name: 'post', params: { q: 'search', '#': 'section' } }] },
        },
      ],
    });

    expect(result.pathnameWithParams).toBe('/post?q=search#section');
  });

  it('removes a trailing index from a route name', () => {
    const result = getRouteInfoFromState({
      routes: [{ name: '__root', state: { routes: [{ name: 'settings/index' }] } }],
    });

    expect(result.pathname).toBe('/settings');
  });

  it.each([
    { description: 'a missing not-found path', value: undefined, pathname: '/' },
    { description: 'a null not-found path', value: null, pathname: '/null' },
    { description: 'a list of not-found path parts', value: ['a', 2], pathname: '/a/2' },
    { description: 'zero in a not-found path', value: 0, pathname: '/0' },
    { description: 'false in a not-found path', value: false, pathname: '/false' },
    {
      description: 'a mixed not-found path',
      value: ['a', null, false],
      pathname: '/a/null/false',
    },
  ])('resolves $description', ({ value, pathname }) => {
    const result = getRouteInfoFromState({
      routes: [
        {
          name: '__root',
          state: { routes: [{ name: '+not-found', params: { 'not-found': value, q: 'search' } }] },
        },
      ],
    });

    expect(result.pathnameWithParams).toBe(`${pathname}?q=search`);
  });

  it.each([
    { description: 'an empty dynamic value', name: '[id]', value: '', pathname: '/' },
    { description: 'a null dynamic value', name: '[id]', value: null, pathname: '/' },
    { description: 'a false dynamic value', name: '[id]', value: false, pathname: '/' },
    { description: 'an empty catch-all value', name: '[...id]', value: '', pathname: '/' },
    { description: 'a null catch-all value', name: '[...id]', value: null, pathname: '/' },
    { description: 'a false catch-all value', name: '[...id]', value: false, pathname: '/' },
    {
      description: 'a mixed catch-all list',
      name: '[...id]',
      value: ['a', null, { ignored: true }, 0],
      pathname: '/a/null/0',
    },
  ])('resolves $description', ({ name, value, pathname }) => {
    const result = getRouteInfoFromState({
      routes: [
        { name: '__root', state: { routes: [{ name, params: { id: value, q: 'search' } }] } },
      ],
    });

    expect(result.pathnameWithParams).toBe(`${pathname}?q=search`);
  });

  it.each([
    {
      description: 'a legacy optional catch-all',
      name: '[...id?]',
      params: { id: ['a', null, 0], 'id?': 'query' },
      pathnameWithParams: '/a/null/0?id%3F=query',
    },
    {
      description: 'an empty dynamic parameter name',
      name: '[]',
      params: { '': 'empty-key', q: 'search' },
      pathnameWithParams: '/empty-key?q=search',
    },
    {
      description: 'an empty catch-all parameter name',
      name: '[...]',
      params: { '': 0, q: 'search' },
      pathnameWithParams: '/?q=search',
    },
    {
      description: 'a repeated dynamic parameter',
      name: '[id]/[id]',
      params: { id: 'repeat', q: 'search' },
      pathnameWithParams: '/repeat/repeat?q=search',
    },
  ])('resolves $description', ({ name, params, pathnameWithParams }) => {
    const result = getRouteInfoFromState({
      routes: [{ name: '__root', state: { routes: [{ name, params }] } }],
    });

    expect(result.pathnameWithParams).toBe(pathnameWithParams);
  });

  it('keeps a parameter named __proto__', () => {
    const result = getRouteInfoFromState({
      routes: [
        {
          name: '__root',
          state: { routes: [{ name: 'post', params: JSON.parse('{"__proto__":"x"}') }] },
        },
      ],
    });

    expect(result.params['__proto__']).toBe('x');
    expect(result.pathnameWithParams).toBe('/post?__proto__=x');
  });

  it('adds the base URL to route links', () => {
    const previousBaseUrl = process.env.EXPO_BASE_URL;
    process.env.EXPO_BASE_URL = 'base';
    try {
      const ordinary = getRouteInfoFromState({
        routes: [{ name: '__root', state: { routes: [{ name: 'post' }] } }],
      });
      const sitemap = getRouteInfoFromState({ routes: [{ name: '_sitemap' }] });

      expect(ordinary.unstable_globalHref).toBe('/base/post');
      expect(sitemap.unstable_globalHref).toBe('/base/_sitemap');
    } finally {
      if (previousBaseUrl === undefined) {
        delete process.env.EXPO_BASE_URL;
      } else {
        process.env.EXPO_BASE_URL = previousBaseUrl;
      }
    }
  });

  it.each([
    { description: 'not-found routes', name: '+not-found' },
    { description: 'sitemap routes', name: '_sitemap' },
  ])('reuses default values for $description', ({ name }) => {
    const result = getRouteInfoFromState({ routes: [{ name }] });

    expect(result.params).toBe(defaultRouteInfo.params);
    expect(result.searchParams).toBe(defaultRouteInfo.searchParams);
  });

  describe('warnings for object parameters', () => {
    const nestedParamsWarning =
      'Navigating with nested object params is not supported. Expo Router URL params must be serializable as strings. Use flat params or serialize the object value.';
    let warn: jest.SpyInstance;

    beforeEach(() => {
      warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    });

    afterEach(() => {
      warn.mockRestore();
    });

    it('warns once for root object parameters', () => {
      const state = {
        routes: [
          {
            name: '__root',
            params: { nested: { id: 'root' } },
            state: { routes: [{ name: 'post' }] },
          },
        ],
      };
      getRouteInfoFromState(state);
      getRouteInfoFromState(state);

      expect(warn).toHaveBeenCalledTimes(1);
      expect(warn).toHaveBeenCalledWith(nestedParamsWarning);
    });

    it.each(['+not-found', '_sitemap'])('warns before returning %s', (name) => {
      getRouteInfoFromState({ routes: [{ name, params: { nested: { id: 'special' } } }] });

      expect(warn).toHaveBeenCalledTimes(1);
      expect(warn).toHaveBeenCalledWith(nestedParamsWarning);
    });

    it('warns before rejecting an invalid root route', () => {
      expect(() =>
        getRouteInfoFromState({ routes: [{ name: 'invalid', params: { nested: {} } }] })
      ).toThrow('Expected the first route to be __root, but got invalid');
      expect(warn).toHaveBeenCalledTimes(1);
      expect(warn).toHaveBeenCalledWith(nestedParamsWarning);
    });
  });
});

describe(areUrlObjectsEqual, () => {
  it('compares route info semantics without comparing derived searchParams', () => {
    const first = {
      ...defaultRouteInfo,
      params: { nested: ['one', 'two'] },
      segments: ['(group)', 'page'],
      searchParams: new URLSearchParams('first=one'),
    };
    const second = {
      ...first,
      params: { nested: ['one', 'two'] },
      segments: ['(group)', 'page'],
      searchParams: new URLSearchParams('second=two'),
    };

    expect(areUrlObjectsEqual(first, second)).toBe(true);
    expect(areUrlObjectsEqual(first, { ...second, pathname: '/other' })).toBe(false);
    expect(areUrlObjectsEqual(first, { ...second, segments: ['page'] })).toBe(false);
    expect(areUrlObjectsEqual(first, { ...second, params: { nested: ['one'] } })).toBe(false);
  });
});
