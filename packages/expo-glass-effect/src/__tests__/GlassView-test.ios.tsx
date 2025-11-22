import { render, screen } from '@testing-library/react-native';

import { GlassView } from '..';

it(`renders a native blur view`, async () => {
  render(<GlassView glassEffectStyle="regular" testID="blur" />);
  const view = await screen.findByTestId('blur');
  expect(view).toBeDefined();
  expect(screen.toJSON()).toMatchSnapshot();
});
