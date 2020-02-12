import 'react-native';

import React from 'react';
import renderer from 'react-test-renderer';

import { Header } from '../Header';

it(`renders Header`, () => {
  const tree = renderer.create(<Header />);
  expect(tree).toMatchSnapshot();
});
