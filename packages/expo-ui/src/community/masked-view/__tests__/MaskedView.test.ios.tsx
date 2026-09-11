import { render } from '@testing-library/react-native';
import { View } from 'react-native';

import { MaskedView } from '..';
import { findNativeViewProps } from '../../../__mocks__/expo';

jest.mock('expo', () => jest.requireActual('../../../__mocks__/expo'));

describe('MaskedView', () => {
  it('keeps the SwiftUI host inside the React Native layout bounds', () => {
    render(
      <MaskedView maskElement={<View />}>
        <View />
      </MaskedView>
    );

    expect(findNativeViewProps('HostView')?.ignoreSafeArea).toBe('all');
  });
});
