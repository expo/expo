/** @jest-environment jsdom */
import { act, render } from '@testing-library/react';
import { View } from 'react-native';

import { ExpoRoot } from '../../../ExpoRoot';
import { router } from '../../../imperative-api';
import JSStack from '../../../layouts/JSStack';
import { getMockContext } from '../../../testing-library/mock-config';
import { HeaderStyleInterpolators } from '../index';

global.ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
} as typeof ResizeObserver;

let warnSpy: jest.SpyInstance;

beforeEach(() => {
  process.env.EXPO_ROUTER_IMPORT_MODE = 'sync';
  warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => {
  jest.restoreAllMocks();
});

it.each([
  ['forUIKit', HeaderStyleInterpolators.forUIKit],
  ['forFade', HeaderStyleInterpolators.forFade],
  ['forSlideLeft', HeaderStyleInterpolators.forSlideLeft],
  ['forSlideRight', HeaderStyleInterpolators.forSlideRight],
  ['forSlideUp', HeaderStyleInterpolators.forSlideUp],
  ['forNoAnimation', HeaderStyleInterpolators.forNoAnimation],
])('does not warn on web with the %s header interpolator', (_name, headerStyleInterpolator) => {
  const context = getMockContext({
    _layout: () => (
      <JSStack
        screenOptions={{
          headerMode: 'float',
          headerStyleInterpolator,
          headerBackButtonDisplayMode: 'default',
        }}
      />
    ),
    index: () => <View />,
    second: () => <View />,
  });
  render(<ExpoRoot context={context} location="/" />);

  act(() => router.push('/second'));

  expect(warnSpy).not.toHaveBeenCalled();
});
