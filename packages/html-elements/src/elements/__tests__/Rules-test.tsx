import 'react-native';

import React from 'react';
import renderer from 'react-test-renderer';

import { Hr } from '../Rules';

it(`renders Hr`, () => {
  const tree = renderer.create(<Hr />);
  expect(tree).toMatchSnapshot();
});
