import { render } from '@testing-library/react-native';
import { View } from 'react-native';

import { Host } from '..';
import { findNativeViewProps } from '../../../__mocks__/expo';

jest.mock('expo', () => jest.requireActual('../../../__mocks__/expo'));
// The host derives its Material palette from the native module; the render only needs an object.
jest.mock('../../ExpoUIModule', () => ({
  ExpoUIModule: { getMaterialColors: () => ({}), isDynamicColorAvailable: false },
}));

describe('Host', () => {
  describe('ignoreSafeArea', () => {
    it('keeps keyboard avoidance by default', () => {
      render(
        <Host style={{ flex: 1 }}>
          <View />
        </Host>
      );

      expect(findNativeViewProps('HostView')?.ignoreSafeAreaKeyboardInsets).toBe(false);
    });

    it('turns keyboard avoidance off for "all"', () => {
      render(
        <Host ignoreSafeArea="all" matchContents>
          <View />
        </Host>
      );

      expect(findNativeViewProps('HostView')?.ignoreSafeAreaKeyboardInsets).toBe(true);
    });

    it('lets ignoreSafeAreaKeyboardInsets take precedence', () => {
      render(
        <Host ignoreSafeArea="all" ignoreSafeAreaKeyboardInsets={false} style={{ flex: 1 }}>
          <View />
        </Host>
      );

      expect(findNativeViewProps('HostView')?.ignoreSafeAreaKeyboardInsets).toBe(false);
    });
  });
});
