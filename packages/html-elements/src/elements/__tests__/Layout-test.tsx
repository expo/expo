import 'react-native';

import React from 'react';
import renderer from 'react-test-renderer';

import { Nav, Footer } from '../Layout';

it(`renders Footer`, () => {
  const tree = renderer.create(<Footer />);
  expect(tree).toMatchSnapshot();
});

it(`renders Nav`, () => {
  const tree = renderer.create(<Nav />);
  expect(tree).toMatchSnapshot();
});
