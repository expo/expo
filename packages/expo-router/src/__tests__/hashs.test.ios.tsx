import React, { Text } from 'react-native';

import { router } from '../exports';
import { act, renderRouter, screen, testRouter } from '../testing-library';

it('can push a hash url', () => {
  renderRouter({
    index: () => <Text testID="index" />,
    test: () => <Text testID="test" />,
  });

  expect(screen).toHavePathname('/');
  expect(screen.getByTestId('index')).toBeOnTheScreen();

  act(() => router.push('/test#my-hash'));
  expect(screen.getByTestId('test')).toBeOnTheScreen();

  expect(screen).toHaveSegments(['test']);
  expect(screen).toHavePathname('/test');
  expect(screen).toHavePathnameWithParams('/test#my-hash');
  expect(screen).toHaveSearchParams({ '#': 'my-hash' });
});

it('route.push() with hash', () => {
  renderRouter({
    index: () => <Text testID="index" />,
    test: () => <Text testID="test" />,
  });

  expect(screen).toHavePathname('/');
  expect(screen.getByTestId('index')).toBeOnTheScreen();

  act(() => router.push('/test#a'));
  expect(screen.getByTestId('test')).toBeOnTheScreen();

  expect(screen).toHaveSegments(['test']);
  expect(screen).toHavePathname('/test');
  expect(screen).toHavePathnameWithParams('/test#a');
  expect(screen).toHaveSearchParams({ '#': 'a' });

  act(() => router.push('/test#b'));
  act(() => router.push('/test#b'));

  expect(screen).toHavePathnameWithParams('/test#b');
  expect(screen).toHaveSearchParams({ '#': 'b' });

  act(() => router.push('/test#c'));
  expect(screen).toHavePathnameWithParams('/test#c');
  expect(screen).toHaveSearchParams({ '#': 'c' });

  act(() => router.back());
  expect(screen).toHavePathname('/test');
  expect(screen).toHavePathnameWithParams('/test#b');
  expect(screen).toHaveSearchParams({ '#': 'b' });

  act(() => router.back());
  expect(screen).toHavePathname('/test');
  expect(screen).toHavePathnameWithParams('/test#a');
  expect(screen).toHaveSearchParams({ '#': 'a' });

  act(() => router.back());
  expect(screen).toHavePathname('/');
});

it('works with search params', () => {
  renderRouter({
    index: () => <Text testID="index" />,
    test: () => <Text testID="test" />,
  });

  expect(screen).toHavePathname('/');
  expect(screen.getByTestId('index')).toBeOnTheScreen();

  act(() => router.navigate('/test?a=1#my-hash'));

  expect(screen.getByTestId('test')).toBeOnTheScreen();
  expect(screen).toHaveSegments(['test']);
  expect(screen).toHavePathname('/test');
  expect(screen).toHavePathnameWithParams('/test?a=1#my-hash');
  expect(screen).toHaveSearchParams({ a: '1', '#': 'my-hash' });

  act(() => router.navigate('/test?a=2#my-hash'));
  expect(screen).toHaveSegments(['test']);
  expect(screen).toHavePathname('/test');
  expect(screen).toHavePathnameWithParams('/test?a=2#my-hash');
  expect(screen).toHaveSearchParams({ a: '2', '#': 'my-hash' });

  act(() => router.navigate('/test?a=2#my-new-hash'));
  expect(screen).toHaveSegments(['test']);
  expect(screen).toHavePathname('/test');
  expect(screen).toHavePathnameWithParams('/test?a=2#my-new-hash');
  expect(screen).toHaveSearchParams({ a: '2', '#': 'my-new-hash' });
});
