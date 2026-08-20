import { render, screen } from '@testing-library/react-native';
import { Text } from 'react-native';

import { ExpoRoot } from '../ExpoRoot';
import { useLocale } from '../react-navigation/native/useLocale';
import { getMockContext } from '../testing-library';

function DirectionProbe() {
  const { direction } = useLocale();
  return <Text testID="direction">{direction}</Text>;
}

const routes = { index: DirectionProbe };

it('defaults the navigation direction to the one reported by I18nManager', () => {
  render(<ExpoRoot context={getMockContext(routes)} location="/" />);
  expect(screen.getByTestId('direction')).toHaveTextContent('ltr');
});

it('forwards the direction prop to the navigation container', () => {
  render(<ExpoRoot context={getMockContext(routes)} location="/" direction="rtl" />);
  expect(screen.getByTestId('direction')).toHaveTextContent('rtl');
});
