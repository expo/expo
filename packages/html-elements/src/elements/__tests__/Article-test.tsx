import 'react-native';

import React from 'react';
import renderer from 'react-test-renderer';

import { Article } from '../Article';

it(`renders Article`, () => {
  const tree = renderer.create(<Article />);
  expect(tree).toMatchSnapshot();
});
