import getPathFromState from '../getPathFromState';

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
      routeNames: ['index', '[test]', '_sitemap', '+not-found'],
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
