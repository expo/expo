import { fireEvent, render } from '@testing-library/react-native';
import { useEffect, useLayoutEffect } from 'react';
import { Pressable } from 'react-native';

import { isRenderingFunctionComponent } from '../isRenderingFunctionComponent';

test('returns true only while a function component renders', async () => {
  const results: Record<string, boolean> = {};

  const Test = () => {
    results.render = isRenderingFunctionComponent();
    useEffect(() => {
      results.effect = isRenderingFunctionComponent();
    }, []);
    useLayoutEffect(() => {
      results.layoutEffect = isRenderingFunctionComponent();
    }, []);

    return (
      <Pressable
        testID="button"
        onPress={() => {
          results.eventHandler = isRenderingFunctionComponent();
        }}
      />
    );
  };

  const root = await render(<Test />);
  fireEvent.press(root.getByTestId('button'));

  expect(results).toEqual({
    render: true,
    effect: false,
    layoutEffect: false,
    eventHandler: false,
  });
  expect(isRenderingFunctionComponent()).toBe(false);
});
