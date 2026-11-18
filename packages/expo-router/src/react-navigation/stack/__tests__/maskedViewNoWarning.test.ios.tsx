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

it('does not warn with the forFade header interpolator', async () => {
  await renderRouter({
    _layout: () => (
      <JSStack screenOptions={{ headerStyleInterpolator: HeaderStyleInterpolators.forFade }} />
    ),
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
