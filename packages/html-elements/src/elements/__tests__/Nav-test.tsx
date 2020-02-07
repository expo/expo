import 'react-native';

import React from 'react';
import renderer from 'react-test-renderer';

import { Nav } from '../Nav';

it(`renders Nav`, () => {
  const tree = renderer.create(<Nav />);
  expect(tree).toMatchSnapshot();
});
