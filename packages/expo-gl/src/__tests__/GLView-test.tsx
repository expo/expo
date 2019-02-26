import 'react-native';

import React from 'react';
import renderer from 'react-test-renderer';

import { GLView } from '../index';
import { GLView as GLViewWeb } from '../GLView.web';

// Note: test renderer must be required after react-native.

it(`renders correctly on iOS & Android`, () => {
  const tree = renderer.create(<GLView onContextCreate={() => {}} />);
  expect(tree).toMatchSnapshot();
});

it(`renders correctly on web`, () => {
  const tree = renderer.create(<GLViewWeb onContextCreate={() => {}} />);
  expect(tree).toMatchSnapshot();
});
