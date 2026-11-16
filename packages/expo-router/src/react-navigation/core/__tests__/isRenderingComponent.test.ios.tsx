import { fireEvent, render } from '@testing-library/react-native';
import { Component, useEffect, useLayoutEffect } from 'react';
import { Pressable } from 'react-native';

import { isRenderingComponent, withWarnOnceIfCalledDuringRender } from '../isRenderingComponent';

afterEach(() => {
  jest.restoreAllMocks();
});

test('returns true only while a component renders', async () => {
  const results: Record<string, boolean> = {};

  class TestClass extends Component {
    render() {
      results.classRender = isRenderingComponent();
      return null;
    }
  }

  const Test = () => {
    results.functionRender = isRenderingComponent();
    useEffect(() => {
      results.effect = isRenderingComponent();
    }, []);
    useLayoutEffect(() => {
      results.layoutEffect = isRenderingComponent();
    }, []);

    return (
      <>
        <TestClass />
        <Pressable
          testID="button"
          onPress={() => {
            results.eventHandler = isRenderingComponent();
          }}
        />
      </>
    );
  };

  const root = await render(<Test />);
  fireEvent.press(root.getByTestId('button'));

  expect(results).toEqual({
    functionRender: true,
    classRender: true,
    effect: false,
    layoutEffect: false,
    eventHandler: false,
  });
  expect(isRenderingComponent()).toBe(false);
});

test('warns for the next wrapped call after a wrapped function throws', async () => {
  const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
  const throwing = withWarnOnceIfCalledDuringRender(() => {
    throw new Error('Getter failed');
  }, 'Throwing getter was called during render.');
  const next = withWarnOnceIfCalledDuringRender(
    () => null,
    'Next getter was called during render.'
  );

  const Test = () => {
    try {
      throwing();
    } catch {}
    next();
    return null;
  };

  await render(<Test />);

  expect(warn.mock.calls).toEqual([
    ['Throwing getter was called during render.'],
    ['Next getter was called during render.'],
  ]);
});
