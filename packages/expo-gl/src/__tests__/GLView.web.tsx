import React from 'react';
import renderer from 'react-test-renderer';
import GLView from '../GLView.web';

it('renders correctly', () => {
  const tree = renderer.create(<GLView onContextCreate={() => {}} />);
  expect(tree).toMatchSnapshot();
});
