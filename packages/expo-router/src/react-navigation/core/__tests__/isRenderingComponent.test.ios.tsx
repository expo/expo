import { fireEvent, render } from '@testing-library/react-native';
import { Component, useEffect, useLayoutEffect } from 'react';
import { Pressable } from 'react-native';

import { isRenderingComponent } from '../isRenderingComponent';

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
