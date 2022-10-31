import { render, screen } from '@testing-library/react-native';
import React from 'react';

import { LinearGradient } from '../LinearGradient';

it(`renders a complex gradient`, () => {
  render(
    <LinearGradient
      colors={['red', 'blue']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      locations={[0.5, 1]}
    />
  );

  expect(screen.toJSON()).toMatchSnapshot();
});
