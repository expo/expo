import { render } from '@testing-library/react-native';
import { View } from 'react-native';

import { Host } from '..';
import { findNativeViewProps } from '../../../__mocks__/expo';

jest.mock('expo', () => jest.requireActual('../../../__mocks__/expo'));

describe('Host', () => {
  describe('ignoreSafeArea', () => {
    it('defaults to "all" when matchContents is set on both axes', () => {
      render(
        <Host matchContents>
          <View />
        </Host>
      );

      expect(findNativeViewProps('HostView')?.ignoreSafeArea).toBe('all');
    });

    it('defaults to "all" when matchContents is set on the vertical axis only', () => {
      render(
        <Host matchContents={{ vertical: true }}>
          <View />
        </Host>
      );

      expect(findNativeViewProps('HostView')?.ignoreSafeArea).toBe('all');
    });

    it('defaults to "all" when matchContents is set on the horizontal axis only', () => {
      render(
        <Host matchContents={{ horizontal: true }}>
          <View />
        </Host>
      );

      expect(findNativeViewProps('HostView')?.ignoreSafeArea).toBe('all');
    });

    it('stays unset on a fill host', () => {
      render(
        <Host style={{ flex: 1 }}>
          <View />
        </Host>
      );

      expect(findNativeViewProps('HostView')?.ignoreSafeArea).toBeUndefined();
    });

    it('keeps an explicit value on a matchContents host', () => {
      render(
        <Host matchContents ignoreSafeArea="keyboard">
          <View />
        </Host>
      );

      expect(findNativeViewProps('HostView')?.ignoreSafeArea).toBe('keyboard');
    });
  });
});
