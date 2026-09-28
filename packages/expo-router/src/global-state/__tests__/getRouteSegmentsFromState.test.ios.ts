import * as routeInfo from '../getRouteInfoFromState';
import { getRouteSegmentsFromState } from '../getRouteSegmentsFromState';

let routeInfoSpy: jest.SpyInstance;
let warnSpy: jest.SpyInstance;
beforeEach(() => {
  routeInfoSpy = jest.spyOn(routeInfo, 'getRouteInfoFromState');
  warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
});
afterEach(() => {
  routeInfoSpy.mockRestore();
  warnSpy.mockRestore();
});

test.each([
  [undefined, []],
  [{ routes: [{ name: '__root' }] }, []],
  [{ routes: [{ name: '+not-found', path: '/missing' }] }, ['+not-found']],
  [{ routes: [{ name: '_sitemap' }] }, ['_sitemap']],
  [{ routes: [{ name: '__root', state: { routes: [{ name: 'index' }] } }] }, []],
  [
    {
      routes: [
        {
          name: '__root',
          state: { routes: [{ name: '/(tabs)/[id]/[...rest]/index' }] },
        },
      ],
    },
    ['(tabs)', '[id]', '[...rest]'],
  ],
  [
    {
      routes: [{ name: '__root', state: { routes: [{ name: '//index/page' }] } }],
    },
    ['', 'index', 'page'],
  ],
])('collects focused segments from %j', (state, segments) => {
  expect(getRouteSegmentsFromState(state)).toEqual(segments);
  expect(routeInfoSpy).not.toHaveBeenCalled();
});

test('follows active indices and leaves route state and params untouched', () => {
  const params = Object.freeze({
    id: 'hello%20world',
    rest: Object.freeze(['a%2Fb']),
  });
  const state = {
    index: 1,
    routes: [
      { name: 'inactive-root', params: { nested: { ignored: true } } },
      {
        name: '__root',
        state: {
          index: 1,
          routes: [
            { name: 'inactive-child', params: { nested: { ignored: true } } },
            {
              name: '(b)',
              state: {
                routes: [{ name: '[id]/[...rest]', params }, { name: 'inactive-page' }],
              },
            },
          ],
        },
      },
    ],
  };
  const original = JSON.parse(JSON.stringify(state));

  expect(getRouteSegmentsFromState(state)).toEqual(['(b)', '[id]', '[...rest]']);
  expect(state).toEqual(original);
  expect(warnSpy).not.toHaveBeenCalled();
  expect(routeInfoSpy).not.toHaveBeenCalled();
});

test('rejects an invalid root after preserving its nested-param warning', () => {
  expect(() =>
    getRouteSegmentsFromState({
      routes: [{ name: 'invalid', params: { nested: {} } }],
    })
  ).toThrow('Expected the first route to be __root, but got invalid');
  expect(warnSpy).toHaveBeenCalledTimes(1);
});

test('warns once per visited params object, including the root', () => {
  const state = {
    routes: [
      {
        name: '__root',
        params: { nested: {} },
        state: {
          routes: [
            {
              name: '(group)',
              params: { nested: {} },
              state: {
                routes: [
                  {
                    name: 'page',
                    params: { screen: 'ordinary', q: ['one', 'two'] },
                  },
                ],
              },
            },
          ],
        },
      },
    ],
  };

  getRouteSegmentsFromState(state);
  getRouteSegmentsFromState(state);

  expect(warnSpy).toHaveBeenCalledTimes(2);
  expect(warnSpy).toHaveBeenCalledWith(
    'Navigating with nested object params is not supported. Expo Router URL params must be serializable as strings. Use flat params or serialize the object value.'
  );
});

test.each(['+not-found', '_sitemap'])('preserves warnings for %s', (name) => {
  expect(getRouteSegmentsFromState({ routes: [{ name, params: { nested: {} } }] })).toEqual([name]);
  expect(warnSpy).toHaveBeenCalledTimes(1);
});
