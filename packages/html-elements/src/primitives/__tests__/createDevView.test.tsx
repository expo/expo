import { render } from '@testing-library/react-native';
import * as React from 'react';
import { Platform, View as NativeView } from 'react-native';

import { createDevView } from '../createDevView';

export const View = createDevView(NativeView);

const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

beforeEach(() => {
  console.error = jest.fn();
  console.warn = jest.fn();
});
afterAll(() => {
  console.error = originalConsoleError;
  console.warn = originalConsoleWarn;
});

it('renders', () => {
  // Ensure no errors
  expect(() =>
    render(
      <View>
        <View />
      </View>
    )
  ).not.toThrow();
});

it('asserts react-dom elements', () => {
  const instance = (
    <View>
      <div />
    </View>
  );

  if (Platform.OS === 'web') {
    // Ensure no errors
    expect(() => render(instance)).not.toThrow();
  } else {
    expect(() => render(instance)).toThrow(/Using unsupported React DOM element/);
  }
});

it('warns about unwrapped strings', () => {
  // Ensure no errors
  const { toJSON } = render(<View>Hey</View>);
  expect(toJSON()).toMatchSnapshot();

  expect(console.warn).toHaveBeenCalledTimes(1);
});
