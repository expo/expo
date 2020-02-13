import 'react-native';

import React from 'react';
import renderer from 'react-test-renderer';

import { HR } from '../Rules';

it(`renders HR`, () => {
  const tree = renderer.create(<HR />);
  expect(tree).toMatchSnapshot();
});
