import 'react-native';

import React from 'react';
import renderer from 'react-test-renderer';

import { BR, HR } from '../Rules';

it(`renders BR`, () => {
  const tree = renderer.create(<BR />);
  expect(tree).toMatchSnapshot();
});

it(`renders HR`, () => {
  const tree = renderer.create(<HR />);
  expect(tree).toMatchSnapshot();
});
