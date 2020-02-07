import 'react-native';

import React from 'react';
import renderer from 'react-test-renderer';

import { P } from '../Text';

it(`renders P`, () => {
  const tree = renderer.create(<P>demo</P>);
  expect(tree).toMatchSnapshot();
});
