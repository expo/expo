import { render, screen } from '@testing-library/react-native';

import { GlassView } from '..';

it.each(['regular', 'clear'] as const)('renders a %s liquid glass view', (style) => {
  render(<GlassView glassEffectStyle={style} testID="glass-view" />);

  expect(screen.getByTestId('glass-view')).toBeVisible();
  expect(screen.toJSON()).toMatchSnapshot();
});
