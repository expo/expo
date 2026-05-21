import { act, screen } from '@testing-library/react-native';
import { stripVTControlCharacters } from 'node:util';

import { router } from '../imperative-api';
import { renderRouter } from '../testing-library';

function getThrownMessage(fn: () => void): string {
  try {
    fn();
  } catch (e) {
    return stripVTControlCharacters((e as Error).message);
  }
  throw new Error('Expected function to throw');
}

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
    const message = getThrownMessage(() => expect(screen).toHavePathname('/xyz'));
    expect(message).toMatchSnapshot();
  });

  it('fails with the correct message for a .not assertion', () => {
    renderRouter(['[slug]'], { initialUrl: '/home?test=true' });
    const message = getThrownMessage(() => expect(screen).not.toHavePathname('/home'));
    expect(message).toMatchSnapshot();
  });
});

describe('toHavePathnameWithParams', () => {
  it('correctly matches', () => {
    renderRouter(['[slug]'], { initialUrl: '/home?test=true' });
    expect(screen).toHavePathnameWithParams('/home?test=true');
  });

  it('fails with the correct message', () => {
    renderRouter(['[slug]'], { initialUrl: '/home?test=true' });
    const message = getThrownMessage(() => expect(screen).toHavePathnameWithParams('/xyz'));
    expect(message).toMatchSnapshot();
  });

  it('fails with the correct message for a .not assertion', () => {
    renderRouter(['[slug]'], { initialUrl: '/home?test=true' });
    const message = getThrownMessage(() =>
      expect(screen).not.toHavePathnameWithParams('/home?test=true')
    );
    expect(message).toMatchSnapshot();
  });
});

describe('toHaveSegments', () => {
  it('correctly matches', () => {
    renderRouter(['[slug]'], { initialUrl: '/home?test=true' });
    expect(screen).toHaveSegments(['[slug]']);
  });

  it('fails with the correct message', () => {
    renderRouter(['[slug]'], { initialUrl: '/home?test=true' });
    const message = getThrownMessage(() => expect(screen).toHaveSegments(['xyz']));
    expect(message).toMatchSnapshot();
  });

  it('fails with the correct message for a .not assertion', () => {
    renderRouter(['[slug]'], { initialUrl: '/home?test=true' });
    const message = getThrownMessage(() => expect(screen).not.toHaveSegments(['[slug]']));
    expect(message).toMatchSnapshot();
  });
});

describe('toHaveSearchParams', () => {
  it('correctly matches', () => {
    renderRouter(['[slug]/[...catchAll]'], { initialUrl: '/home/long/name?test=true' });
    expect(screen).toHaveSearchParams({ slug: 'home', test: 'true', catchAll: ['long', 'name'] });
  });

  it('fails with the correct message', () => {
    renderRouter(['[slug]'], { initialUrl: '/home?test=true' });
    const message = getThrownMessage(() => expect(screen).toHaveSearchParams({ slug: 'xyz' }));
    expect(message).toMatchSnapshot();
  });

  it('fails with the correct message for a .not assertion', () => {
    renderRouter(['[slug]'], { initialUrl: '/home?test=true' });
    const params = { slug: 'home', test: 'true' };
    const message = getThrownMessage(() => expect(screen).not.toHaveSearchParams(params));
    expect(message).toMatchSnapshot();
  });
});

describe('toHaveRouterState', () => {
  // This test is currently broken in React Navigation v7 as @react-navigation/routers still has the prerenderRoutes key
  it.skip('correctly matches', () => {
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

  it('fails with the correct message', () => {
    renderRouter(['[slug]'], { initialUrl: '/home?test=true' });
    const message = getThrownMessage(() => expect(screen).toHaveRouterState({ routes: [] }));
    expect(message).toMatchSnapshot();
  });

  it('fails with the correct message for a .not assertion', () => {
    const result = renderRouter(['[slug]'], { initialUrl: '/home?test=true' });
    const state = result.getRouterState();
    const message = getThrownMessage(() => expect(screen).not.toHaveRouterState(state));
    expect(message).toMatchSnapshot();
  });
});
