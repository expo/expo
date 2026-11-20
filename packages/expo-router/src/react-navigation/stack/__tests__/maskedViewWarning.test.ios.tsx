import { act } from '@testing-library/react-native';
import { View } from 'react-native';

import { router } from '../../../imperative-api';
import JSStack from '../../../layouts/JSStack';
import { renderRouter } from '../../../testing-library';
import * as MaskedViewNative from '../../elements/MaskedViewNative';
import { HeaderStyleInterpolators } from '../index';

let warnSpy: jest.SpyInstance;

beforeEach(() => {
  jest.replaceProperty(MaskedViewNative, 'isMaskedViewAvailable', false);
  warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => {
  jest.restoreAllMocks();
});

it.each([
  ['forFade', HeaderStyleInterpolators.forFade],
  ['forSlideLeft', HeaderStyleInterpolators.forSlideLeft],
  ['forSlideRight', HeaderStyleInterpolators.forSlideRight],
  ['forSlideUp', HeaderStyleInterpolators.forSlideUp],
  ['forNoAnimation', HeaderStyleInterpolators.forNoAnimation],
])('does not warn with the %s header interpolator', async (_name, headerStyleInterpolator) => {
  await renderRouter({
    _layout: () => <JSStack screenOptions={{ headerStyleInterpolator }} />,
    index: () => <View />,
    second: () => <View />,
  });

  await act(() => router.push('/second'));

  expect(warnSpy).not.toHaveBeenCalled();
});

it('does not warn with the default header interpolator', async () => {
  await renderRouter({
    _layout: () => <JSStack />,
    index: () => <View />,
    second: () => <View />,
  });

  await act(() => router.push('/second'));

  expect(warnSpy).not.toHaveBeenCalled();
});

it('does not warn when the masked view is available', async () => {
  jest.replaceProperty(MaskedViewNative, 'isMaskedViewAvailable', true);

  await renderRouter({
    _layout: () => (
      <JSStack screenOptions={{ headerStyleInterpolator: HeaderStyleInterpolators.forUIKit }} />
    ),
    index: () => <View />,
    second: () => <View />,
  });

  await act(() => router.push('/second'));

  expect(warnSpy).not.toHaveBeenCalled();
});

it('does not warn with a custom back image', async () => {
  await renderRouter({
    _layout: () => (
      <JSStack
        screenOptions={{
          headerStyleInterpolator: HeaderStyleInterpolators.forUIKit,
          headerBackImage: () => <View />,
        }}
      />
    ),
    index: () => <View />,
    second: () => <View />,
  });

  await act(() => router.push('/second'));

  expect(warnSpy).not.toHaveBeenCalled();
});

it('does not warn with a custom headerLeft', async () => {
  await renderRouter({
    _layout: () => (
      <JSStack
        screenOptions={{
          headerStyleInterpolator: HeaderStyleInterpolators.forUIKit,
          headerLeft: () => null,
        }}
      />
    ),
    index: () => <View />,
    second: () => <View />,
  });

  await act(() => router.push('/second'));

  expect(warnSpy).not.toHaveBeenCalled();
});

it('does not warn with the minimal back button display mode', async () => {
  await renderRouter({
    _layout: () => (
      <JSStack
        screenOptions={{
          headerStyleInterpolator: HeaderStyleInterpolators.forUIKit,
          headerBackButtonDisplayMode: 'minimal',
        }}
      />
    ),
    index: () => <View />,
    second: () => <View />,
  });

  await act(() => router.push('/second'));

  expect(warnSpy).not.toHaveBeenCalled();
});

// `useWarnOnce` remembers shown warnings for the whole file, so this test runs last.
it('warns once with the forUIKit header interpolator when the masked view is unavailable', async () => {
  await renderRouter({
    _layout: () => (
      <JSStack screenOptions={{ headerStyleInterpolator: HeaderStyleInterpolators.forUIKit }} />
    ),
    index: () => <View />,
    second: () => <View />,
    third: () => <View />,
  });

  expect(warnSpy).not.toHaveBeenCalled();

  await act(() => router.push('/second'));

  expect(warnSpy).toHaveBeenCalledTimes(1);
  expect(warnSpy).toHaveBeenCalledWith(
    'The back button label in `expo-router/js-stack` is not masked during the `forUIKit` header animation because `@react-native-masked-view/masked-view` is not installed or not linked in the native app. Run `npx expo install @react-native-masked-view/masked-view`, then rebuild the native app.'
  );

  await act(() => router.push('/third'));

  expect(warnSpy).toHaveBeenCalledTimes(1);
});
