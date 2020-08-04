import 'react-native';

import React from 'react';
import renderer from 'react-test-renderer';

import { A } from '../Anchor';

it(`renders A`, () => {
  const tree = renderer.create(<A href="#" target="_parent" />);
  expect(tree).toMatchSnapshot();
});
