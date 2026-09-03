import { act, render } from '@testing-library/react-native';
import * as React from 'react';

import { router } from '../../imperative-api';
import JSStack from '../../layouts/JSStack';
import Stack from '../../layouts/Stack';
import Tabs from '../../layouts/Tabs';
import { CommonActions, useNavigation, useRoute } from '../../react-navigation/native';
import { renderRouter } from '../../testing-library';
import {
  NavigationAwareActivity,
  useActivityMode,
  type ActivityMode,
} from '../NavigationAwareActivity';

jest.mock('../ActivityContents', () => ({
  ActivityContents: ({ children, mode }: React.ActivityProps) => {
    const React = require('react') as typeof import('react');
    return <React.Activity mode={mode}>{children}</React.Activity>;
  },
}));

function EmptyScreen() {
  return null;
}

function renderModes({ tabs = false, threshold }: { tabs?: boolean; threshold?: number } = {}) {
  const modes: Record<string, ActivityMode> = {};

  function ModeReporter() {
    const route = useRoute();
    modes[route.name] = useActivityMode(threshold);
    return null;
  }

  renderRouter({
    _layout: () =>
      tabs ? (
        <Tabs>
          <Tabs.Screen name="index" />
          <Tabs.Screen name="b" />
          <Tabs.Screen name="c" />
          <Tabs.Screen name="d" />
          <Tabs.Screen name="e" />
        </Tabs>
      ) : (
        <Stack />
      ),
    index: ModeReporter,
    b: ModeReporter,
    c: ModeReporter,
    d: ModeReporter,
    e: ModeReporter,
  });

  return modes;
}

test('hides stack screens at the default depth', () => {
  const modes = renderModes();

  act(() => router.push('/b'));
  act(() => router.push('/c'));
  act(() => router.push('/d'));
  act(() => router.push('/e'));

  expect(modes).toEqual({
    index: 'hidden',
    b: 'hidden',
    c: 'hidden',
    d: 'visible',
    e: 'visible',
  });

  act(() => router.back());

  expect(modes).toEqual({
    index: 'hidden',
    b: 'hidden',
    c: 'visible',
    d: 'visible',
    e: 'visible',
  });
});

test.each([
  {
    threshold: 1,
    navigate: () => {
      router.push('/b');
      router.push('/c');
    },
    expected: { index: 'hidden', b: 'hidden', c: 'visible' },
  },
  {
    threshold: 3,
    navigate: () => {
      router.push('/b');
      router.push('/c');
      router.push('/d');
    },
    expected: { index: 'hidden', b: 'visible', c: 'visible', d: 'visible' },
  },
] as const)('supports stack depth $threshold', ({ threshold, navigate, expected }) => {
  const modes = renderModes({ threshold });

  act(navigate);

  expect(modes).toEqual(expected);
});

test.each([
  {
    threshold: 1,
    expected: {
      index: 'hidden',
      b: 'hidden',
      c: 'hidden',
      d: 'hidden',
      e: 'visible',
    },
  },
  {
    threshold: 2,
    expected: {
      index: 'visible',
      b: 'visible',
      c: 'visible',
      d: 'visible',
      e: 'visible',
    },
  },
] as const)('uses depth $threshold for tabs', ({ threshold, expected }) => {
  const modes = renderModes({ tabs: true, threshold });

  act(() => router.navigate('/b'));
  act(() => router.navigate('/c'));
  act(() => router.navigate('/d'));
  act(() => router.navigate('/e'));

  expect(modes).toEqual(expected);

  if (threshold === 1) {
    act(() => router.navigate('/b'));
    expect(modes.index).toBe('hidden');
    expect(modes.b).toBe('visible');
  }
});

test('keeps preloaded stack routes visible', () => {
  const modes: Record<string, ActivityMode> = {};
  let preload = () => {};

  function ModeReporter() {
    const navigation = useNavigation();
    const route = useRoute();
    modes[route.name] = useActivityMode();

    if (route.name === 'index') {
      preload = () => navigation.dispatch(CommonActions.preload('b'));
    }

    return null;
  }

  renderRouter({ _layout: () => <JSStack />, index: ModeReporter, b: ModeReporter });

  act(preload);

  expect(modes.b).toBe('visible');
});

test('cleans up effects while preserving local state', async () => {
  const effect = jest.fn();
  const cleanup = jest.fn();
  const renderedValues: number[] = [];
  let setValue: React.Dispatch<React.SetStateAction<number>> = () => {};

  function StatefulScreen() {
    const [value, updateValue] = React.useState(0);
    setValue = updateValue;
    renderedValues.push(value);

    React.useEffect(() => {
      effect();
      return cleanup;
    }, []);

    return null;
  }

  renderRouter({
    _layout: () => <JSStack />,
    index: () => (
      <NavigationAwareActivity>
        <StatefulScreen />
      </NavigationAwareActivity>
    ),
    b: EmptyScreen,
    c: EmptyScreen,
  });

  act(() => setValue(1));
  act(() => router.push('/b'));
  act(() => router.push('/c'));

  expect(cleanup).toHaveBeenCalledTimes(1);

  await act(async () => router.back());

  expect(effect).toHaveBeenCalledTimes(2);
  expect(renderedValues.at(-1)).toBe(1);
});

test('throws outside a screen', () => {
  expect(() => render(<NavigationAwareActivity>content</NavigationAwareActivity>)).toThrow(
    'NavigationAwareActivity must be rendered inside a screen component.'
  );
});

test('throws when wrapping a layout navigator', () => {
  expect(() =>
    renderRouter({
      _layout: () => (
        <NavigationAwareActivity>
          <Stack />
        </NavigationAwareActivity>
      ),
      index: EmptyScreen,
    })
  ).toThrow('NavigationAwareActivity must be rendered inside a screen component.');
});
