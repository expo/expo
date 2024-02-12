import { testRouter, renderRouter } from '../testing-library';

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

    testRouter.back('/page');
    testRouter.back('/page');
    testRouter.back('/page?b=true');
    testRouter.back('/page?a=true');
    testRouter.back('/page');

    expect(testRouter.canGoBack()).toBe(false);
  });
});

describe('navigate', () => {
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
    testRouter.navigate('/page'); // We are still on page. This will search the search params but not navigate
    testRouter.navigate('/page'); // Will not create new screen are we are already on page
    testRouter.navigate('/page?c=true');

    testRouter.back('/page');
    testRouter.back('/page?a=true'); // We go back to a=true, as b=true was replaced
    testRouter.back('/page');

    expect(testRouter.canGoBack()).toBe(false);
  });

  it.skip('handles popToTop', async () => {
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
    (testRouter as any).popToTop('/page');

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

    testRouter.back('/page?a=true');
    testRouter.back('/page?a=true'); // It will be present twice
    testRouter.back('/page');

    expect(testRouter.canGoBack()).toBe(false);
  });
});
