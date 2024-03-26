import { router } from '../imperative-api';
import { act, renderRouter, screen } from '../testing-library';

/*
 * Smoke Tests for the Testing Library. While we use these functions in the other tests, we want to make sure they work as expected.
 */
it('toHavePathname', () => {
  renderRouter(['[slug]'], { initialUrl: '/home?test=true' });
  expect(screen).toHavePathname('/home');
});

it('toHavePathnameWithParams', () => {
  renderRouter(['[slug]'], { initialUrl: '/home?test=true' });
  expect(screen).toHavePathnameWithParams('/home?test=true');
});

it('toHaveSearchParams', () => {
  renderRouter(['[slug]/[...catchAll]'], { initialUrl: '/home/long/name?test=true' });
  expect(screen).toHaveSearchParams({ slug: 'home', test: 'true', catchAll: ['long', 'name'] });
});

it('toHavePathnameWithParams', () => {
  renderRouter(['[slug]'], { initialUrl: '/home?test=true' });
  expect(screen).toHavePathnameWithParams('/home?test=true');
});

it('toHaveRouterState', () => {
  renderRouter(['[slug]', '[...catchAll]', 'directory/page'], { initialUrl: '/home?test=true' });
  act(() => router.navigate('/directory/page'));
  expect(screen).toHaveRouterState({
    index: 1,
    key: expect.any(String),
    routeNames: ['_sitemap', 'directory/page', '[slug]', '[...catchAll]', '+not-found'],
    routes: [
      {
        key: expect.any(String),
        name: '[slug]',
        params: {
          slug: 'home',
          test: 'true',
        },
        path: '/home?test=true',
      },
      {
        key: expect.any(String),
        name: 'directory/page',
        params: {},
        path: undefined,
      },
    ],
    stale: false,
    type: 'stack',
  });
});
