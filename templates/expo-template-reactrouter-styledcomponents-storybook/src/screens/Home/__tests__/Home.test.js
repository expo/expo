import React from 'react';
import { create } from 'react-test-renderer';
import HomeScreen from '..';

describe('HomeScreen', () => {
  const renderer = create(<HomeScreen />);

  it('renders', () => {
    expect(renderer.toJSON()).toMatchSnapshot();
  });

  it('has welcome text', () => {
    renderer.root.findByProps({ children: 'Welcome Home!' });
  });
});
