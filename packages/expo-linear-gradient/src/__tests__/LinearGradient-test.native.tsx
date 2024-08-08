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

it(`fails to typecheck with less than two colors`, () => {
  // @ts-expect-error
  render(<LinearGradient colors={['red']} />);

  // @ts-expect-error
  render(<LinearGradient colors={[]} />);

  // colors not provided inline need to be marked `as const`
  const colors = ['cyan', '#ff00ff', 'rgba(0,0,0,0)', 'rgba(0,255,255,0.5)'] as const;
  render(<LinearGradient colors={colors} />);

  render(<LinearGradient colors={['red', 'green']} />);
});
