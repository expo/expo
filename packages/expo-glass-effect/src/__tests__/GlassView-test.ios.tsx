import { render, screen } from '@testing-library/react-native';
import { DynamicColorIOS, PlatformColor, type ColorValue } from 'react-native';

import { GlassView } from '..';

it.each(['regular', 'clear'] as const)('renders a %s liquid glass view', (style) => {
  render(<GlassView glassEffectStyle={style} testID="glass-view" />);

  expect(screen.getByTestId('glass-view')).toBeVisible();
  expect(screen.toJSON()).toMatchSnapshot();
});

const tintColors: [string, ColorValue][] = [
  ['a string', 'rgba(255, 59, 48, 0.7)'],
  ['a PlatformColor', PlatformColor('systemBlue')],
  ['a DynamicColorIOS', DynamicColorIOS({ light: 'white', dark: 'black' })],
];

it.each(tintColors)('renders a liquid glass view tinted with %s', (_name, tintColor) => {
  render(<GlassView tintColor={tintColor} testID="glass-view" />);

  expect(screen.getByTestId('glass-view')).toBeVisible();
  expect(screen.toJSON()).toMatchSnapshot();
});
