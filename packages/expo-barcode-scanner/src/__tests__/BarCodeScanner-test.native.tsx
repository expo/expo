import 'react-native';

import { render, screen } from '@testing-library/react-native';
import React from 'react';

import { BarCodeScanner } from '../BarCodeScanner';

it(`renders correctly`, async () => {
  render(<BarCodeScanner testID="barcodescanner" onBarCodeScanned={() => {}} />);
  const view = await screen.findByTestId('barcodescanner');
  expect(view).toBeDefined();
  expect(screen.toJSON()).toMatchSnapshot();
});
