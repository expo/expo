import { render, screen } from '@testing-library/react-native';
import React from 'react';

import { BlurView } from '..';

it(`renders a native blur view`, async () => {
  render(<BlurView tint="light" intensity={0.65} testID="blur" />);
  const view = await screen.findByTestId('blur');
  expect(view).toBeDefined();
  expect(screen.toJSON()).toMatchSnapshot();
}, 10000);
