import { act, screen } from '@testing-library/react-native';
import * as React from 'react';
import { Text } from 'react-native';

import { router } from '../imperative-api';
import { Stack } from '../layouts/Stack';
import { usePreventRemove } from '../react-navigation/core';
import { renderRouter } from '../testing-library';
import { useNavigation } from '../useNavigation';

/*
 * These tests were originally written against a bare BaseNavigationContainer +
 * MockRouter harness, mounting a nested navigator ad-hoc inside a screen's render
 * function and navigating into it on first visit. That path relies on the nested
 * navigator's initial slice committing in a second React commit, which is a
 * harness artifact: renderRouter runs the real route compiler, which always
 * carries the nested subtree on the action, so the gap doesn't exist here.
 * Converted to renderRouter, preserving how many prevent-remove callbacks fire,
 * that removal is blocked until allowed, and which screen ends up focused.
 */

function useBeforeRemove(onBeforeRemove: () => void, shouldPreventRef: React.RefObject<boolean>) {
  const navigation = useNavigation();
  React.useEffect(
    () =>
      navigation.addListener('beforeRemove', (e) => {
        onBeforeRemove();
        if (shouldPreventRef.current) {
          e.preventDefault();
        }
      }),
    [navigation]
  );
}

describe("prevents removing a child screen with 'beforeRemove' event", () => {
  it('blocks until allowed, then proceeds', () => {
    const onBeforeRemove = jest.fn();
    const shouldPreventRef = { current: true };

    function Qux() {
      useBeforeRemove(onBeforeRemove, shouldPreventRef);
      return <Text testID="qux">qux</Text>;
    }

    renderRouter({
      _layout: () => <Stack />,
      index: () => <Text testID="index">index</Text>,
      bar: () => <Text testID="bar">bar</Text>,
      'baz/_layout': () => <Stack />,
      'baz/index': Qux,
      'baz/lex': () => <Text testID="lex">lex</Text>,
    });

    act(() => router.push('/bar'));
    act(() => router.push('/baz'));
    expect(screen.getByTestId('qux')).toBeVisible();

    act(() => router.dismissAll());
    expect(onBeforeRemove).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId('qux')).toBeVisible();

    shouldPreventRef.current = false;
    act(() => router.dismissAll());
    expect(screen.getByTestId('index')).toBeVisible();
  });
});

describe("prevents removing a grand child screen with 'beforeRemove' event", () => {
  it('blocks until allowed, then proceeds', () => {
    const onBeforeRemove = jest.fn();
    const shouldPreventRef = { current: true };

    function Lex() {
      useBeforeRemove(onBeforeRemove, shouldPreventRef);
      return <Text testID="lex">lex</Text>;
    }

    renderRouter({
      _layout: () => <Stack />,
      index: () => <Text testID="index">index</Text>,
      bar: () => <Text testID="bar">bar</Text>,
      'baz/_layout': () => <Stack />,
      'baz/index': () => <Text testID="qux">qux</Text>,
      'baz/qux/_layout': () => <Stack />,
      'baz/qux/index': Lex,
    });

    act(() => router.push('/bar'));
    act(() => router.push('/baz/qux'));
    expect(screen.getByTestId('lex')).toBeVisible();

    act(() => router.dismissAll());
    expect(onBeforeRemove).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId('lex')).toBeVisible();

    shouldPreventRef.current = false;
    act(() => router.dismissAll());
    expect(screen.getByTestId('index')).toBeVisible();
  });
});

describe("prevents removing by multiple screens with 'beforeRemove' event", () => {
  it('blocks until all screens allow, then proceeds', () => {
    const onBeforeRemove = {
      bar: jest.fn(),
      baz: jest.fn(),
      lex: jest.fn(),
    };
    const shouldPrevent = {
      bar: true,
      baz: true,
      lex: true,
    };

    function makeScreen(name: keyof typeof onBeforeRemove, testID: string) {
      return function TestScreen() {
        const navigation = useNavigation();
        React.useEffect(
          () =>
            navigation.addListener('beforeRemove', (e) => {
              onBeforeRemove[name]();
              e.preventDefault();
              if (!shouldPrevent[name]) {
                navigation.dispatch(e.data.action);
              }
            }),
          [navigation]
        );
        return <Text testID={testID}>{testID}</Text>;
      };
    }

    renderRouter({
      _layout: () => <Stack />,
      index: () => <Text testID="index">index</Text>,
      bar: makeScreen('bar', 'bar'),
      baz: makeScreen('baz', 'baz'),
      'bax/_layout': () => <Stack />,
      'bax/index': () => <Text testID="qux">qux</Text>,
      'bax/qux/_layout': () => <Stack />,
      'bax/qux/index': makeScreen('lex', 'lex'),
    });

    act(() => {
      router.push('/bar');
      router.push('/baz');
      router.push('/bax/qux');
    });
    expect(screen.getByTestId('lex')).toBeVisible();

    act(() => router.dismissAll());
    expect(onBeforeRemove.lex).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId('lex')).toBeVisible();

    shouldPrevent.lex = false;
    act(() => router.dismissAll());
    expect(onBeforeRemove.baz).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId('lex')).toBeVisible();

    shouldPrevent.baz = false;
    act(() => router.dismissAll());
    expect(onBeforeRemove.bar).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId('lex')).toBeVisible();

    shouldPrevent.bar = false;
    act(() => router.dismissAll());
    expect(screen.getByTestId('index')).toBeVisible();
  });
});

describe("prevents removing a child screen with 'beforeRemove' event with 'resetRoot'", () => {
  it('blocks a replace-driven reset until allowed, then proceeds', () => {
    const onBeforeRemove = jest.fn();
    const shouldPreventRef = { current: true };

    function Qux() {
      useBeforeRemove(onBeforeRemove, shouldPreventRef);
      return <Text testID="qux">qux</Text>;
    }

    renderRouter({
      _layout: () => <Stack />,
      index: () => <Text testID="index">index</Text>,
      bar: () => <Text testID="bar">bar</Text>,
      'baz/_layout': () => <Stack />,
      'baz/index': Qux,
      'baz/lex': () => <Text testID="lex">lex</Text>,
    });

    act(() => router.push('/baz'));
    expect(screen.getByTestId('qux')).toBeVisible();

    act(() => router.replace('/'));
    expect(onBeforeRemove).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId('qux')).toBeVisible();

    shouldPreventRef.current = false;
    act(() => router.replace('/'));
    expect(screen.getByTestId('index')).toBeVisible();
  });
});

describe("prevents removing a child screen with 'usePreventRemove' hook", () => {
  it('blocks until allowed, then proceeds', () => {
    const onPreventRemove = jest.fn();
    let shouldContinue = false;

    function Qux() {
      const nav = useNavigation();
      usePreventRemove(true, ({ data }) => {
        onPreventRemove();
        if (shouldContinue) nav.dispatch(data.action);
      });
      return <Text testID="qux">qux</Text>;
    }

    renderRouter({
      _layout: () => <Stack />,
      index: () => <Text testID="index">index</Text>,
      bar: () => <Text testID="bar">bar</Text>,
      'baz/_layout': () => <Stack />,
      'baz/index': Qux,
      'baz/lex': () => <Text testID="lex">lex</Text>,
    });

    act(() => router.push('/bar'));
    act(() => router.push('/baz'));
    expect(screen.getByTestId('qux')).toBeVisible();

    act(() => router.dismissAll());
    expect(onPreventRemove).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId('qux')).toBeVisible();

    shouldContinue = true;
    act(() => router.dismissAll());
    expect(screen.getByTestId('index')).toBeVisible();
  });
});

describe("prevents removing a grand child screen with 'usePreventRemove' hook", () => {
  it('blocks until allowed, then proceeds', () => {
    const onPreventRemove = jest.fn();
    let shouldContinue = false;

    function Lex() {
      const nav = useNavigation();
      usePreventRemove(true, ({ data }) => {
        onPreventRemove();
        if (shouldContinue) nav.dispatch(data.action);
      });
      return <Text testID="lex">lex</Text>;
    }

    renderRouter({
      _layout: () => <Stack />,
      index: () => <Text testID="index">index</Text>,
      bar: () => <Text testID="bar">bar</Text>,
      'baz/_layout': () => <Stack />,
      'baz/index': () => <Text testID="qux">qux</Text>,
      'baz/qux/_layout': () => <Stack />,
      'baz/qux/index': Lex,
    });

    act(() => router.push('/bar'));
    act(() => router.push('/baz/qux'));
    expect(screen.getByTestId('lex')).toBeVisible();

    act(() => router.dismissAll());
    expect(onPreventRemove).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId('lex')).toBeVisible();

    shouldContinue = true;
    act(() => router.dismissAll());
    expect(screen.getByTestId('index')).toBeVisible();
  });
});

describe("prevents removing by multiple screens with 'usePreventRemove' hook", () => {
  it('blocks until all screens allow, then proceeds', () => {
    const onPreventRemove = {
      bar: jest.fn(),
      baz: jest.fn(),
      lex: jest.fn(),
    };
    const shouldContinue = {
      bar: true,
      baz: true,
      lex: true,
    };

    function makeScreen(name: keyof typeof onPreventRemove, testID: string) {
      return function TestScreen() {
        const nav = useNavigation();
        usePreventRemove(true, ({ data }) => {
          onPreventRemove[name]();
          if (!shouldContinue[name]) {
            nav.dispatch(data.action);
          }
        });
        return <Text testID={testID}>{testID}</Text>;
      };
    }

    renderRouter({
      _layout: () => <Stack />,
      index: () => <Text testID="index">index</Text>,
      bar: makeScreen('bar', 'bar'),
      baz: makeScreen('baz', 'baz'),
      'bax/_layout': () => <Stack />,
      'bax/index': () => <Text testID="qux">qux</Text>,
      'bax/qux/_layout': () => <Stack />,
      'bax/qux/index': makeScreen('lex', 'lex'),
    });

    act(() => {
      router.push('/bar');
      router.push('/baz');
      router.push('/bax/qux');
    });
    expect(screen.getByTestId('lex')).toBeVisible();

    act(() => router.dismissAll());
    expect(onPreventRemove.lex).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId('lex')).toBeVisible();

    shouldContinue.lex = false;
    act(() => router.dismissAll());
    expect(onPreventRemove.baz).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId('lex')).toBeVisible();

    shouldContinue.baz = false;
    act(() => router.dismissAll());
    expect(onPreventRemove.bar).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId('lex')).toBeVisible();

    shouldContinue.bar = false;
    act(() => router.dismissAll());
    expect(screen.getByTestId('index')).toBeVisible();
  });
});

describe("prevents removing a child screen with 'usePreventRemove' hook with 'resetRoot'", () => {
  it('blocks a replace-driven reset (continuation is never requested)', () => {
    // Mirrors the original: `shouldContinue` never flips to true here, so this
    // only exercises the "stays blocked" branch, not the "let it through" one.
    const shouldContinue = false;

    function Qux() {
      const nav = useNavigation();
      usePreventRemove(true, ({ data }) => {
        if (shouldContinue) nav.dispatch(data.action);
      });
      return <Text testID="qux">qux</Text>;
    }

    renderRouter({
      _layout: () => <Stack />,
      index: () => <Text testID="index">index</Text>,
      bar: () => <Text testID="bar">bar</Text>,
      'baz/_layout': () => <Stack />,
      'baz/index': Qux,
      'baz/lex': () => <Text testID="lex">lex</Text>,
    });

    act(() => router.push('/baz'));
    expect(screen.getByTestId('qux')).toBeVisible();

    act(() => router.replace('/'));
    expect(screen.getByTestId('qux')).toBeVisible();
  });
});
