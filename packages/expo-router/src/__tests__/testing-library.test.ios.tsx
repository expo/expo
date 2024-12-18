import * as React from 'react';
import { Text } from 'react-native';

import { Redirect, Slot } from '../exports';
import { router } from '../imperative-api';
import Drawer from '../layouts/Drawer';
import Stack from '../layouts/Stack';
import Tabs from '../layouts/Tabs';
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

// This test is currently broken in React Navigation v7 as @react-navigation/routers still has the prerenderRoutes key
it('toHaveRouterState', () => {
  renderRouter(['[slug]', '[...catchAll]', 'directory/page'], { initialUrl: '/home?test=true' });
  act(() => router.navigate('/directory/page'));
  expect(screen).toHaveRouterState({
    index: 1,
    key: expect.any(String),
    preloadedRoutes: [],
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

it('correctly asserts the state on delayed state updates', () => {
  // redirect will render the screen as null
  // This causes the router, which was expecting 'auth' to exist to
  // fire an additional state update to render the correct screen
  renderRouter(
    {
      '/home/_layout': () => {
        return (
          <Stack>
            <Stack.Screen name="auth" redirect />
            <Stack.Screen name="pages" />
          </Stack>
        );
      },
      '/home/auth': () => null,
      '/home/pages': () => <Text testID="text">screenA</Text>,
    },
    {
      initialUrl: '/home',
    }
  );

  expect(screen.getByTestId('text')).toHaveTextContent('screenA');
  expect(screen).toHavePathname('/home/pages');
});
