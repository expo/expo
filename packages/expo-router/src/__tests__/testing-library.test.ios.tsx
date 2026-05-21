import { act, screen } from '@testing-library/react-native';

import { router } from '../imperative-api';
import { renderRouter } from '../testing-library';

/*
 * Smoke Tests for the Testing Library. While we use these functions in the other tests, we want to make sure they work as expected.
 */
describe('toHavePathname', () => {
  it('correctly matches', () => {
    renderRouter(['[slug]'], { initialUrl: '/home?test=true' });
    expect(screen).toHavePathname('/home');
  });

  it('fails with the correct message', () => {
    renderRouter(['[slug]'], { initialUrl: '/home?test=true' });
    expect(() => expect(screen).toHavePathname('/xyz')).toThrow(/\.toHavePathname/);
    expect(() => expect(screen).toHavePathname('/xyz')).toThrow(/Expected: "\/xyz"/);
    expect(() => expect(screen).toHavePathname('/xyz')).toThrow(/Received: "\/home"/);
  });

  it('fails with the correct message for a .not assertion', () => {
    renderRouter(['[slug]'], { initialUrl: '/home?test=true' });
    expect(() => expect(screen).not.toHavePathname('/home')).toThrow(/\.not\.toHavePathname/);
    expect(() => expect(screen).not.toHavePathname('/home')).toThrow(/Expected: not "\/home"/);
    expect(() => expect(screen).not.toHavePathname('/home')).toThrow(/Received: "\/home"/);
  });
});

describe('toHavePathnameWithParams', () => {
  it('correctly matches', () => {
    renderRouter(['[slug]'], { initialUrl: '/home?test=true' });
    expect(screen).toHavePathnameWithParams('/home?test=true');
  });

  it('fails with the correct message', () => {
    renderRouter(['[slug]'], { initialUrl: '/home?test=true' });
    expect(() => expect(screen).toHavePathnameWithParams('/xyz')).toThrow(
      /\.toHavePathnameWithParams/
    );
    expect(() => expect(screen).toHavePathnameWithParams('/xyz')).toThrow(/Expected: "\/xyz"/);
    expect(() => expect(screen).toHavePathnameWithParams('/xyz')).toThrow(
      /Received: "\/home\?test=true"/
    );
  });

  it('fails with the correct message for a .not assertion', () => {
    renderRouter(['[slug]'], { initialUrl: '/home?test=true' });
    expect(() => expect(screen).not.toHavePathnameWithParams('/home?test=true')).toThrow(
      /\.not\.toHavePathnameWithParams/
    );
    expect(() => expect(screen).not.toHavePathnameWithParams('/home?test=true')).toThrow(
      /Expected: not "\/home\?test=true"/
    );
    expect(() => expect(screen).not.toHavePathnameWithParams('/home?test=true')).toThrow(
      /Received: "\/home\?test=true"/
    );
  });
});

it('toHaveSearchParams', () => {
  renderRouter(['[slug]/[...catchAll]'], { initialUrl: '/home/long/name?test=true' });
  expect(screen).toHaveSearchParams({ slug: 'home', test: 'true', catchAll: ['long', 'name'] });
});

// This test is currently broken in React Navigation v7 as @react-navigation/routers still has the prerenderRoutes key
it.skip('toHaveRouterState', () => {
  renderRouter(['[slug]', '[...catchAll]', 'directory/page'], { initialUrl: '/home?test=true' });
  act(() => router.navigate('/directory/page'));
  expect(screen).toHaveRouterState({
    index: 1,
    key: expect.any(String),
    routeNames: ['directory/page', '[slug]', '[...catchAll]'],
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
