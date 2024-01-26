import { testRouter, renderRouter } from '../testing-library';

describe('push', () => {
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
    testRouter.push('/page'); // This "pushes" the previous /page to the top of the stack
    testRouter.push('/page?c=true');

    testRouter.back('/page');
    testRouter.back('/page?b=true');
    testRouter.back('/page?a=true');

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
    testRouter.navigate('/page'); // This wil clear the previous two routes
    testRouter.navigate('/page?c=true');

    testRouter.back('/page');

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
