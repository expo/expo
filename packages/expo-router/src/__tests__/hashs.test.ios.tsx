import React, { Text } from 'react-native';

import { router } from '../exports';
import { store } from '../global-state/router-store';
import { act, renderRouter, screen } from '../testing-library';

it('can push a hash url', () => {
  renderRouter({
    index: () => <Text testID="index" />,
    test: () => <Text testID="test" />,
  });

  expect(screen).toHavePathname('/');
  expect(screen.getByTestId('index')).toBeOnTheScreen();

  act(() => router.push('/test#a'));
  expect(screen.getByTestId('test')).toBeOnTheScreen();

  act(() => router.push('/test#b'));
  act(() => router.push('/test#b'));
  act(() => router.push('/test#c'));

  expect(store.rootStateSnapshot()).toStrictEqual({
    index: 4,
    key: expect.any(String),
    routeNames: ['index', 'test', '_sitemap', '+not-found'],
    routes: [
      {
        key: expect.any(String),
        name: 'index',
        params: undefined,
        path: '/',
      },
      {
        key: expect.any(String),
        name: 'test',
        params: {
          '#': 'a',
        },
        path: undefined,
      },
      {
        key: expect.any(String),
        name: 'test',
        params: {
          '#': 'b',
        },
        path: undefined,
      },
      {
        key: expect.any(String),
        name: 'test',
        params: {
          '#': 'b',
        },
        path: undefined,
      },
      {
        key: expect.any(String),
        name: 'test',
        params: {
          '#': 'c',
        },
        path: undefined,
      },
    ],
    stale: false,
    type: 'stack',
  });
});

it('works alongside with search params', () => {
  renderRouter({
    index: () => <Text testID="index" />,
    test: () => <Text testID="test" />,
  });

  expect(screen).toHavePathname('/');
  expect(screen.getByTestId('index')).toBeOnTheScreen();

  // Add a hash
  act(() => router.navigate('/test?a=1#hash1'));
  expect(screen.getByTestId('test')).toBeOnTheScreen();
  expect(screen).toHaveSegments(['test']);
  expect(screen).toHavePathname('/test');
  expect(screen).toHavePathnameWithParams('/test?a=1#hash1');
  expect(screen).toHaveSearchParams({ a: '1', '#': 'hash1' });

  act(() => router.navigate('/test?a=2#hash2'));
  expect(screen).toHaveSegments(['test']);
  expect(screen).toHavePathname('/test');
  expect(screen).toHavePathnameWithParams('/test?a=2#hash2');
  expect(screen).toHaveSearchParams({ a: '2', '#': 'hash2' });

  act(() => router.navigate('/test?a=3'));
  expect(screen).toHaveSegments(['test']);
  expect(screen).toHavePathname('/test');
  expect(screen).toHavePathnameWithParams('/test?a=3');
  expect(screen).toHaveSearchParams({ a: '3' });
});

it('navigating to the same route with a hash will only rerender the screen', () => {
  renderRouter({
    index: () => <Text testID="index" />,
  });

  expect(store.rootStateSnapshot()).toStrictEqual({
    routes: [
      {
        name: 'index',
        path: '/',
      },
    ],
    stale: true,
  });

  act(() => router.navigate('/?#hash1'));

  expect(store.rootStateSnapshot()).toStrictEqual({
    index: 0,
    key: expect.any(String),
    routeNames: ['index', '_sitemap', '+not-found'],
    routes: [
      {
        name: 'index',
        key: expect.any(String),
        path: '/',
        params: {
          '#': 'hash1',
        },
      },
    ],
    stale: false,
    type: 'stack',
  });
});
