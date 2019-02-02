import 'react-native';
import React from 'react';
import renderer from 'react-test-renderer';
import GLView from '../GLView';

// Note: test renderer must be required after react-native.

it('renders correctly', () => {
  const tree = renderer.create(<GLView onContextCreate={() => {}} />);
  expect(tree).toMatchSnapshot();
});
