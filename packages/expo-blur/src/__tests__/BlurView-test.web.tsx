import React from 'react';
import { mount } from 'enzyme';
import { StyleSheet } from 'react-native';

import { BlurView } from '..';

const getStyleProp = (component, prop) => StyleSheet.flatten(component.prop('style'))[prop];

// @ts-ignore
const originalCSS = global.CSS;

beforeEach(() => {
  // @ts-ignore
  global.CSS = {
    supports() {
      return true;
    },
  };
});

afterAll(() => {
  // @ts-ignore
  global.CSS = originalCSS;
});

it(`prefers filters to background color`, () => {
  const withNativeBlur = mount(<BlurView tint="light" />);
  expect(getStyleProp(withNativeBlur.find('div'), 'WebkitBackdropFilter')).toBeDefined();
  expect(getStyleProp(withNativeBlur.find('div'), 'backdropFilter')).toBeDefined();
});

it(`uses a transparent background color when filters aren't supported`, () => {
  // @ts-ignore
  global.CSS = undefined;

  const withoutNativeBlur = mount(<BlurView tint="light" />);
  expect(getStyleProp(withoutNativeBlur.find('div'), 'WebkitBackdropFilter')).not.toBeDefined();
  expect(getStyleProp(withoutNativeBlur.find('div'), 'backdropFilter')).not.toBeDefined();
  expect(getStyleProp(withoutNativeBlur.find('div'), 'backgroundColor')).toBeDefined();
});
