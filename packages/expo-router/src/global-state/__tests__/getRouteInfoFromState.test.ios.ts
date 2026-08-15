import { getRouteInfoFromState, defaultRouteInfo } from '../getRouteInfoFromState';

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

  it('decodes URI-encoded params', () => {
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

    expect(result.params.name).toBe('hello world');
    expect(result.pathname).toBe('/hello world');
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

  it('handles incomplete state with screen/params nesting', () => {
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

    expect(result.segments).toEqual(['(tabs)', 'settings', 'profile']);
    expect(result.pathname).toBe('/settings/profile');
    expect(result.pathnameWithParams).toBe('/settings/profile');
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

  it('decodes array params in catch-all', () => {
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

    expect(result.params.path).toEqual(['hello world', 'foo/bar']);
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
});
