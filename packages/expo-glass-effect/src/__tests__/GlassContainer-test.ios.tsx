import { render, screen } from '@testing-library/react-native';

import { GlassView, GlassContainer } from '..';

it('renders a liquid glass container view', () => {
  render(
    <GlassContainer spacing={8} testID="glass-container">
      <GlassView testID="glass-children-1" />
      <GlassView testID="glass-children-2" />
    </GlassContainer>
  );

  expect(screen.getByTestId('glass-container')).toBeVisible();
  expect(screen.getByTestId('glass-children-1')).toBeVisible();
  expect(screen.getByTestId('glass-children-2')).toBeVisible();
  expect(screen.toJSON()).toMatchSnapshot();
});
