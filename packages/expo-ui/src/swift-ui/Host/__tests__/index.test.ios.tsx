import { render } from '@testing-library/react-native';
import { View } from 'react-native';

import { Host } from '..';
import { findNativeViewProps } from '../../../__mocks__/expo';

jest.mock('expo', () => jest.requireActual('../../../__mocks__/expo'));

describe('Host', () => {
  describe('ignoreSafeArea', () => {
    it('ignores the container safe area by default', () => {
      render(
        <Host style={{ flex: 1 }}>
          <View />
        </Host>
      );

      expect(findNativeViewProps('HostView')?.ignoreSafeArea).toBe('container');
    });

    it('passes an explicit value through', () => {
      render(
        <Host ignoreSafeArea="none" matchContents>
          <View />
        </Host>
      );

      expect(findNativeViewProps('HostView')?.ignoreSafeArea).toBe('none');
    });
  });
});
