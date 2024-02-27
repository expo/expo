import React from 'react';

import { router } from '../imperative-api';
import Stack from '../layouts/Stack';
import Tabs from '../layouts/Tabs';
import { act, screen, renderRouter, testRouter } from '../testing-library';
/**
 * Stacks are the most common navigator and have unique navigation actions
 *
 * This file is for testing Stack specific functionality
 */
describe('canDismiss', () => {
  it('should work within the default Stack', () => {
    renderRouter(
      {
        a: () => null,
        b: () => null,
      },
      {
        initialUrl: '/a',
      }
    );

    expect(router.canDismiss()).toBe(false);
    act(() => router.push('/b'));
    expect(router.canDismiss()).toBe(true);
  });

  it('should always return false while not within a stack', () => {
    renderRouter(
      {
        a: () => null,
        b: () => null,
        _layout: () => <Tabs />,
      },
      {
        initialUrl: '/a',
      }
    );

    expect(router.canDismiss()).toBe(false);
    act(() => router.push('/b'));
    expect(router.canDismiss()).toBe(false);
  });
});

test('dismiss', () => {
  renderRouter(
    {
      a: () => null,
      b: () => null,
      c: () => null,
      d: () => null,
    },
    {
      initialUrl: '/a',
    }
  );

  act(() => router.push('/b'));
  act(() => router.push('/c'));
  act(() => router.push('/d'));

  expect(screen).toHavePathname('/d');

  act(() => router.dismiss());
  expect(screen).toHavePathname('/c');

  act(() => router.dismiss(2));
  expect(screen).toHavePathname('/a');
});

test('dismissAll', () => {
  renderRouter(
    {
      a: () => null,
      b: () => null,
      c: () => null,
      d: () => null,
    },
    {
      initialUrl: '/a',
    }
  );

  act(() => router.push('/b'));
  act(() => router.push('/c'));
  act(() => router.push('/d'));

  expect(screen).toHavePathname('/d');

  act(() => router.dismissAll());
  expect(screen).toHavePathname('/a');
  expect(router.canDismiss()).toBe(false);
});

test('pushing in a nested stack should only rerender the nested stack', () => {
  const RootLayout = jest.fn(() => <Stack />);
  const NestedLayout = jest.fn(() => <Stack />);
  const NestedNestedLayout = jest.fn(() => <Stack />);

  renderRouter(
    {
      _layout: RootLayout,
      '[one]/_layout': NestedLayout,
      '[one]/a': () => null,
      '[one]/b': () => null,
      '[one]/[two]/_layout': NestedNestedLayout,
      '[one]/[two]/a': () => null,
    },
    {
      initialUrl: '/one/a',
    }
  );

  testRouter.push('/one/b');
  expect(RootLayout).toHaveBeenCalledTimes(1);
  expect(NestedLayout).toHaveBeenCalledTimes(2);
  expect(NestedNestedLayout).toHaveBeenCalledTimes(0);

  testRouter.push('/one/two/a');
  expect(RootLayout).toHaveBeenCalledTimes(1);
  expect(NestedLayout).toHaveBeenCalledTimes(3);
  expect(NestedNestedLayout).toHaveBeenCalledTimes(1);
});
