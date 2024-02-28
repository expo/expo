import { store } from '../global-state/router-store';
import { router } from '../imperative-api';
import { screen, testRouter, renderRouter, act } from '../testing-library';

describe('push', () => {
  /*
   * @see: https://reactnavigation.org/docs/navigating/#navigate-to-a-route-multiple-times
   */
  it('can handle navigation between routes', async () => {
    renderRouter(
      {
        page: () => null,
      },
      {
        initialUrl: 'page',
      }
    );

    testRouter.push('/page?a=true'); // New params always push
    testRouter.push('/page?b=true');
    testRouter.push('/page'); // This pushes the a new '/page'
    testRouter.push('/page'); // Duplicate pushes are allowed pushes the new '/page'
    testRouter.push('/page?c=true');

    expect(store.rootState).toStrictEqual({
      index: 5,
      key: expect.any(String),
      routeNames: ['page', '_sitemap', '+not-found'],
      routes: [
        {
          key: expect.any(String),
          name: 'page',
          params: undefined,
          path: '/page',
        },
        {
          key: expect.any(String),
          name: 'page',
          params: {
            a: 'true',
          },
          path: undefined,
        },
        {
          key: expect.any(String),
          name: 'page',
          params: {
            b: 'true',
          },
          path: undefined,
        },
        {
          key: expect.any(String),
          name: 'page',
          params: {},
          path: undefined,
        },
        {
          key: expect.any(String),
          name: 'page',
          params: {},
          path: undefined,
        },
        {
          key: expect.any(String),
          name: 'page',
          params: {
            c: 'true',
          },
          path: undefined,
        },
      ],
      stale: false,
      type: 'stack',
    });

    testRouter.back();
    testRouter.back();
    testRouter.back();
    testRouter.back();
    testRouter.back();

    expect(store.rootState).toEqual({
      index: 0,
      key: expect.any(String),
      routeNames: ['page', '_sitemap', '+not-found'],
      routes: [
        {
          key: expect.any(String),
          name: 'page',
          params: undefined,
          path: '/page',
        },
      ],
      stale: false,
      type: 'stack',
    });

    expect(testRouter.canGoBack()).toBe(false);
  });
});

describe('navigate', () => {
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

    expect(store.rootState).toStrictEqual({
      index: 3,
      key: expect.any(String),
      routeNames: ['page', '_sitemap', '+not-found'],
      routes: [
        {
          key: expect.any(String),
          name: 'page',
          params: undefined,
          path: '/page',
        },
        {
          key: expect.any(String),
          name: 'page',
          params: {
            a: 'true',
          },
          path: undefined,
        },
        {
          key: expect.any(String),
          name: 'page',
          params: {},
          path: undefined,
        },
        {
          key: expect.any(String),
          name: 'page',
          params: {
            c: 'true',
          },
          path: undefined,
        },
      ],
      stale: false,
      type: 'stack',
    });

    testRouter.back('/page');
    testRouter.back('/page?a=true'); // We go back to a=true, as b=true was replaced
    testRouter.back('/page');

    expect(testRouter.canGoBack()).toBe(false);
  });

  it('handles dismissAll', async () => {
    // TODO: add popToTop to the router
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
    testRouter.navigate('/page?c=true');

    expect(store.rootState).toStrictEqual({
      index: 3,
      key: expect.any(String),
      routeNames: ['page', '_sitemap', '+not-found'],
      routes: [
        {
          key: expect.any(String),
          name: 'page',
          params: undefined,
          path: '/page',
        },
        {
          key: expect.any(String),
          name: 'page',
          params: {
            a: 'true',
          },
          path: undefined,
        },
        {
          key: expect.any(String),
          name: 'page',
          params: {
            b: 'true',
          },
          path: undefined,
        },
        {
          key: expect.any(String),
          name: 'page',
          params: {
            c: 'true',
          },
          path: undefined,
        },
      ],
      stale: false,
      type: 'stack',
    });

    testRouter.dismissAll();

    expect(store.rootState).toStrictEqual({
      index: 0,
      key: expect.any(String),
      routeNames: ['page', '_sitemap', '+not-found'],
      routes: [
        {
          key: expect.any(String),
          name: 'page',
          params: undefined,
          path: '/page',
        },
      ],
      stale: false,
      type: 'stack',
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

    testRouter.navigate('/page?a=true');
    testRouter.navigate('/page?b=true');
    testRouter.replace('/page?a=true'); // This will clear the previous route
    testRouter.navigate('/page?c=true');

    expect(store.rootState).toStrictEqual({
      index: 3,
      key: expect.any(String),
      routeNames: ['page', '_sitemap', '+not-found'],
      routes: [
        {
          key: expect.any(String),
          name: 'page',
          params: undefined,
          path: '/page',
        },
        {
          key: expect.any(String),
          name: 'page',
          params: {
            a: 'true',
          },
          path: undefined,
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
          path: undefined,
        },
      ],
      stale: false,
      type: 'stack',
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
