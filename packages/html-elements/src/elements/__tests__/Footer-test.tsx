import 'react-native';

import React from 'react';
import renderer from 'react-test-renderer';

import { Footer } from '../Footer';

it(`renders Footer`, () => {
  const tree = renderer.create(<Footer />);
  expect(tree).toMatchSnapshot();
});
