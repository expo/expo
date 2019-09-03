import React from 'react';
import { create } from 'react-test-renderer';
import NavBar from '..';

describe('NavBar', () => {
  const renderer = create(<NavBar />);

  it('renders', () => {
    expect(renderer.toJSON()).toMatchSnapshot();
  });
});
