import React from 'react';

import { router } from '../imperative-api';
import Stack from '../layouts/Stack';
import Tabs from '../layouts/Tabs';
import { act, screen, renderRouter } from '../testing-library';
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

  it('should work with nested stacks', () => {
    renderRouter(
      {
        _layout: () => <Tabs />,
        '(a)/_layout': () => <Stack />,
        '(a)/a': () => null,
        '(a)/b': () => null,
        c: () => null,
      },
      {
        initialUrl: '/a',
      }
    );

    expect(router.canDismiss()).toBe(false);
    act(() => router.push('/b'));
    expect(router.canDismiss()).toBe(true);

    act(() => router.push('/c'));
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
