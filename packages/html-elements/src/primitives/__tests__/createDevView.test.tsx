import React from 'react';
import { Platform, View as NativeView } from 'react-native';
import renderer from 'react-test-renderer';

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

it(`renders`, () => {
  // Ensure no errors
  renderer
    .create(
      <View>
        <View />
      </View>
    )
    .toJSON();
});

it(`asserts react-dom elements`, () => {
  const instance = (
    <View>
      <div />
    </View>
  );
  if (Platform.OS === 'web') {
    // Ensure no errors
    expect(() => renderer.create(instance)).not.toThrowError();
  } else {
    expect(() => renderer.create(instance)).toThrowError(/Using unsupported React DOM element/);
  }
});

it(`warns about unwrapped strings`, () => {
  // Ensure no errors
  expect(renderer.create(<View>Hey</View>).toJSON()).toMatchSnapshot();

  expect(console.warn).toHaveBeenCalledTimes(1);
});
