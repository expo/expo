import { mount } from 'enzyme';
import React from 'react';
import { Animated, StyleSheet } from 'react-native';

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

it(`supports Animated API`, () => {
  // react-native-web 0.11 doesn't support createAnimatedComponent with functional components.
  // This test ensures that the current version of RNW in Expo works with expo-blur.
  Animated.createAnimatedComponent(BlurView);
});

it(`intensity is capped at 100`, () => {
  const withNativeBlur = mount(<BlurView intensity={3737} tint="light" />);
  expect(getStyleProp(withNativeBlur.find('div'), 'backdropFilter')).toContain('blur(20px)');
  expect(getStyleProp(withNativeBlur.find('div'), 'backgroundColor')).toContain('0.78');
});
