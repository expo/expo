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
