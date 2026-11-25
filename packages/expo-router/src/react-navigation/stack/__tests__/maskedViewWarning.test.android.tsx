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
  ['forUIKit', HeaderStyleInterpolators.forUIKit],
  ['forFade', HeaderStyleInterpolators.forFade],
  ['forSlideLeft', HeaderStyleInterpolators.forSlideLeft],
  ['forSlideRight', HeaderStyleInterpolators.forSlideRight],
  ['forSlideUp', HeaderStyleInterpolators.forSlideUp],
  ['forNoAnimation', HeaderStyleInterpolators.forNoAnimation],
])(
  'does not warn on Android with the %s header interpolator when the masked view is unavailable',
  async (_name, headerStyleInterpolator) => {
    await renderRouter({
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

    await act(() => router.push('/second'));

    expect(warnSpy).not.toHaveBeenCalled();
  }
);
