import { screen, act } from '@testing-library/react-native';

import { store } from '../global-state/store';
import { router } from '../imperative-api';
import { renderRouter, testRouter } from '../testing-library';

describe('push', () => {
  /*
   * Push should always push
   * @see: https://reactnavigation.org/docs/navigating/#navigate-to-a-route-multiple-times
   */
  it('can handle navigation between routes', async () => {
    renderRouter(
      {
        page: () => null,
      },
      {
        initialUrl: '/page',
      }
    );

    testRouter.push('/page?a=true'); // New params always push
    testRouter.push('/page?b=true');
    testRouter.push('/page'); // This pushes the a new '/page'
    testRouter.push('/page'); // Duplicate pushes are allowed pushes the new '/page'
    testRouter.push('/page?c=true');

    expect(store.state).toStrictEqual({
      index: 0,
      key: expect.any(String),
      routeNames: ['__root', '+not-found', '_sitemap'],
      routes: [
        {
          key: expect.any(String),
          name: '__root',
          state: {
            index: 5,
            key: expect.any(String),
            routeNames: ['page'],
            routes: [
              {
                key: expect.any(String),
                name: 'page',
              },
              {
                key: expect.any(String),
                name: 'page',
                params: {
                  a: 'true',
                },
              },
              {
                key: expect.any(String),
                name: 'page',
                params: {
                  b: 'true',
                },
              },
              {
                key: expect.any(String),
                name: 'page',
                params: {},
              },
              {
                key: expect.any(String),
                name: 'page',
                params: {},
              },
              {
                key: expect.any(String),
                name: 'page',
                params: {
                  c: 'true',
                },
              },
            ],
            stale: false,
          },
        },
      ],
      stale: false,
    });

    testRouter.back();
    testRouter.back();
    testRouter.back();
    testRouter.back();
    testRouter.back();

    expect(store.state).toEqual({
      index: 0,
      key: expect.any(String),
      routeNames: ['__root', '+not-found', '_sitemap'],
      routes: [
        {
          key: expect.any(String),
          name: '__root',
          params: undefined,
          state: {
            index: 0,
            key: expect.any(String),
            routeNames: ['page'],
            routes: [
              {
                key: expect.any(String),
                name: 'page',
                params: undefined,
              },
            ],
            stale: false,
          },
        },
      ],
      stale: false,
    });

    expect(testRouter.canGoBack()).toBe(false);
  });
});

describe('navigate', () => {
  // Navigate ignores search params when routing.
  it('can handle navigation between routes', async () => {
    /*
     * This test is currently incorrect. See #27285
     */
    renderRouter(
      {
        page: () => null,
      },
      {
        initialUrl: 'page',
      }
    );

    testRouter.navigate('/page?a=true');
    testRouter.navigate('/page?b=true');
    testRouter.navigate('/page'); // We are still on page. This will search the search params but not navigate
    testRouter.navigate('/page'); // Will not create new screen are we are already on page
    testRouter.navigate('/page?c=true');

    expect(store.state).toStrictEqual({
      index: 0,
      key: expect.any(String),
      routeNames: ['__root', '+not-found', '_sitemap'],
      routes: [
        {
          key: expect.any(String),
          name: '__root',
          state: {
            index: 0,
            key: expect.any(String),
            routeNames: ['page'],
            routes: [
              {
                key: expect.any(String),
                name: 'page',
                params: {
                  c: 'true',
                },
              },
            ],
            stale: false,
          },
        },
      ],
      stale: false,
    });

    // There is nothing to go back, as we only re-rerendered the same route.
    expect(testRouter.canGoBack()).toBe(false);
  });

  it('handles dismissAll', async () => {
    // TODO: add popToTop to the router
    renderRouter({
      index: () => null,
      '[page]': () => null,
    });

    testRouter.navigate('/a');
    testRouter.navigate('/b');
    testRouter.navigate('/c');

    expect(store.state).toStrictEqual({
      index: 0,
      key: expect.any(String),
      routeNames: ['__root', '+not-found', '_sitemap'],
      routes: [
        {
          key: expect.any(String),
          name: '__root',
          state: {
            index: 3,
            key: expect.any(String),
            routeNames: ['index', '[page]'],
            routes: [
              {
                key: expect.any(String),
                name: 'index',
              },
              {
                key: expect.any(String),
                name: '[page]',
                params: {
                  page: 'a',
                },
              },
              {
                key: expect.any(String),
                name: '[page]',
                params: {
                  page: 'b',
                },
              },
              {
                key: expect.any(String),
                name: '[page]',
                params: {
                  page: 'c',
                },
              },
            ],
            stale: false,
          },
        },
      ],
      stale: false,
    });

    testRouter.dismissAll();

    expect(store.state).toStrictEqual({
      index: 0,
      key: expect.any(String),
      routeNames: ['__root', '+not-found', '_sitemap'],
      routes: [
        {
          key: expect.any(String),
          name: '__root',
          state: {
            index: 0,
            key: expect.any(String),
            routeNames: ['index', '[page]'],
            routes: [
              {
                key: expect.any(String),
                name: 'index',
              },
            ],
            stale: false,
          },
        },
      ],
      stale: false,
    });

    expect(testRouter.canGoBack()).toBe(false);
  });
});

describe('replace', () => {
  it('can handle navigation between routes', async () => {
    renderRouter(
      {
        page: () => null,
      },
      {
        initialUrl: 'page',
      }
    );

    testRouter.push('/page?a=true');
    testRouter.push('/page?b=true');
    testRouter.replace('/page?a=true'); // This will clear the previous route
    testRouter.push('/page?c=true');

    expect(store.state).toStrictEqual({
      index: 0,
      key: expect.any(String),
      routeNames: ['__root', '+not-found', '_sitemap'],
      routes: [
        {
          key: expect.any(String),
          name: '__root',
          state: {
            index: 3,
            key: expect.any(String),
            routeNames: ['page'],
            routes: [
              {
                key: expect.any(String),
                name: 'page',
              },
              {
                key: expect.any(String),
                name: 'page',
                params: {
                  a: 'true',
                },
              },
              {
                key: expect.any(String),
                name: 'page',
                params: {
                  a: 'true',
                },
              },
              {
                key: expect.any(String),
                name: 'page',
                params: {
                  c: 'true',
                },
              },
            ],
            stale: false,
          },
        },
      ],
      stale: false,
    });

    testRouter.back('/page?a=true');
    testRouter.back('/page?a=true'); // It will be present twice
    testRouter.back('/page');

    expect(testRouter.canGoBack()).toBe(false);
  });
});

it('can handle search params with special characters', async () => {
  renderRouter({
    index: () => null,
  });

  act(() => router.push('/?a=(param)'));

  expect(screen).toHavePathnameWithParams('/?a=%28param%29');
  expect(screen).toHaveSearchParams({ a: '(param)' });
});

it('can handle array search params', async () => {
  renderRouter({
    index: () => null,
  });

  act(() => router.push('/?array=1&array=2'));

  expect(screen).toHavePathnameWithParams('/?array=1&array=2');
  expect(screen).toHaveSearchParams({ array: ['1', '2'] });
});
