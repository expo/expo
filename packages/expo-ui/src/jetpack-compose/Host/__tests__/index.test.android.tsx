import { render } from '@testing-library/react-native';
import { Text } from 'react-native';

import { Host } from '..';
import { type MaterialColors, useMaterialColors } from '../../colors';

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

function Palette({ onRender }: { onRender?: (colors: MaterialColors) => void }) {
  const colors = useMaterialColors();
  onRender?.(colors);
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

  it('returns overrides in the #RRGGBBAA form of the other roles', async () => {
    const { getByTestId } = await render(
      <Host colorScheme="light" colorOverrides={{ primary: '#1e88e5', surface: '#f008' }}>
        <Palette />
      </Host>
    );

    expect(getByTestId('palette').props.children).toBe('#1E88E5FF #FF000088');
  });

  it('keeps the palette reference-stable when an equal inline object is passed again', async () => {
    const palettes: MaterialColors[] = [];
    const tree = () => (
      <Host colorScheme="light" colorOverrides={{ primary: '#FF0000FF' }}>
        <Palette onRender={(colors) => palettes.push(colors)} />
      </Host>
    );
    const { rerender } = await render(tree());
    await rerender(tree());

    expect(palettes.length).toBeGreaterThan(1);
    expect(new Set(palettes).size).toBe(1);
  });
});
