import 'react-native';
import React from 'react';
import renderer from 'react-test-renderer';
import { BarCodeScanner } from '../BarCodeScanner';

it('renders correctly', () => {
  const tree = renderer.create(<BarCodeScanner onBarCodeScanned={() => {}} />);
  expect(tree).toMatchSnapshot();
});
