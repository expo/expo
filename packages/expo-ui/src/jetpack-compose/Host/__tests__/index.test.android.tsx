import { render } from '@testing-library/react-native';
import { Text } from 'react-native';

import { Host } from '..';
import { useMaterialColors } from '../../colors';

jest.mock('expo', () => {
  const { createElement } = require('react');
  const { View } = require('react-native');
  return {
    requireNativeModule: jest.fn(() => ({
      getMaterialColors: jest.fn(() => ({ primary: '#6750A4FF', surface: '#FEF7FFFF' })),
    })),
    requireNativeView: jest.fn(() => (props: any) => createElement(View, props)),
  };
});

function Palette() {
  const colors = useMaterialColors();
  return <Text testID="palette">{`${colors.primary} ${colors.surface}`}</Text>;
}

describe('Host', () => {
  it('applies colorOverrides on top of the palette it provides to descendants', async () => {
    const { getByTestId } = await render(
      <Host colorScheme="light" colorOverrides={{ primary: '#FF0000FF' }}>
        <Palette />
      </Host>
    );

    expect(getByTestId('palette').props.children).toBe('#FF0000FF #FEF7FFFF');
  });
});
