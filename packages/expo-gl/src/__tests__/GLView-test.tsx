import 'react-native';

import React from 'react';
import renderer from 'react-test-renderer';

import { GLView } from '../index';

// Note: test renderer must be required after react-native.

it(`renders static`, () => {
  const tree = renderer.create(<GLView onContextCreate={() => {}} />);
  expect(tree).toMatchSnapshot();
});
