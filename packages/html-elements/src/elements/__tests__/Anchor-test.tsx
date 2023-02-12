import 'react-native';

import React from 'react';
import renderer, { act } from 'react-test-renderer';

import { A } from '../Anchor';

it(`renders A`, () => {
  let tree;
  act(() => {
    tree = renderer.create(<A href="#" target="_parent" />);
  });
  expect(tree).toMatchSnapshot();
});
