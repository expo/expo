import 'react-native';

import React from 'react';
import renderer from 'react-test-renderer';

import { Section } from '../Section';

it(`renders Section`, () => {
  const tree = renderer.create(<Section />);
  expect(tree).toMatchSnapshot();
});
