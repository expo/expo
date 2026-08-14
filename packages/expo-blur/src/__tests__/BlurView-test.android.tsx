import { render, screen } from '@testing-library/react-native';

import { BlurView } from '..';

it(`renders a native blur view`, async () => {
  render(<BlurView tint="light" intensity={0.65} testID="blur" />);
  const view = await screen.findByTestId('blur');
  expect(view).toBeDefined();
  expect(screen.toJSON()).toMatchSnapshot();
}, 10000);

it(`passes radius styles to the native blur view`, async () => {
  render(
    <BlurView
      tint="light"
      intensity={80}
      testID="blur"
      style={{
        width: 100,
        height: 100,
        borderRadius: 24,
        borderTopLeftRadius: 8,
        borderCurve: 'continuous',
        shadowOpacity: 0.2,
      }}
    />
  );

  const view = await screen.findByTestId('blur');
  expect(view).toBeDefined();
  expect(screen.toJSON()).toMatchSnapshot();
});
