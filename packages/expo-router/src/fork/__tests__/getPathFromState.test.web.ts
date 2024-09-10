import getPathFromState, { appendBaseUrl } from '../getPathFromState';

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

describe('basePath support', () => {
  const oldBaseUrl = process.env.EXPO_BASE_URL;

  beforeAll(() => {
    process.env.EXPO_BASE_URL = '/test';
  });

  afterAll(() => {
    process.env.EXPO_BASE_URL = oldBaseUrl;
  });

  it('appends baseUrl to the paths without schemes', () => {
    expect(appendBaseUrl('/home')).toBe('/test/home');
  });

  it('does not appends baseUrl to the paths without schemes', () => {
    expect(appendBaseUrl('http://www.example.com/home')).toBe('http://www.example.com/home');
  });
});
