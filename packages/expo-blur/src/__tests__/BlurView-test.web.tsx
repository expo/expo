/**
 * @jest-environment jsdom
 */

import { render, getByTestId } from '@testing-library/react';
import React from 'react';
import { Animated } from 'react-native';

import { BlurView } from '..';

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
  const withNativeBlur = render(<BlurView tint="light" testID="blur" />);
  const view = getByTestId(withNativeBlur.container, 'blur');

  expect(view.style['backdropFilter']).toBeDefined();
});

it(`uses a transparent background color when filters aren't supported`, () => {
  // @ts-ignore
  global.CSS = undefined;

  const withoutNativeBlur = render(<BlurView tint="light" testID="blur" />);
  const view = getByTestId(withoutNativeBlur.container, 'blur');

  expect(view.style['backdropFilter']).toBeUndefined();
  expect(view.style['backgroundColor']).toBeDefined();
});

it(`supports Animated API`, () => {
  // react-native-web 0.11 doesn't support createAnimatedComponent with functional components.
  // This test ensures that the current version of RNW in Expo works with expo-blur.
  Animated.createAnimatedComponent(BlurView);
});

it(`intensity is capped at 100`, () => {
  const withNativeBlur = render(<BlurView intensity={3737} tint="light" testID="blur" />);
  const view = getByTestId(withNativeBlur.container, 'blur');

  expect(view.style['backdropFilter']).toContain('blur(20px)');
  expect(view.style['backgroundColor']).toContain('0.78');
});
