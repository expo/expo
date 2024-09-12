/**
 * @jest-environment jsdom
 */

import { render, screen } from '@testing-library/react';
import React from 'react';

import { LinearGradient } from '../LinearGradient';
import { getLinearGradientBackgroundImage } from '../NativeLinearGradient.web';

it(`renders`, () => {
  const colors = ['cyan', '#ff00ff', 'rgba(0,0,0,0)', 'rgba(0,255,255,0.5)'] as const;
  render(<LinearGradient colors={colors} testID="gradient" />);
  const view = screen.getByTestId('gradient');

  expect(view).toMatchInlineSnapshot(`
    <div
      class="css-view-175oi2r"
      data-testid="gradient"
    />
  `);
});

it(`computes the correct gradient background image for a simple set of props`, () => {
  const colors = ['cyan', '#ff00ff', 'rgba(0,0,0,0)', 'rgba(0,255,255,0.5)'];
  const backgroundImage = getLinearGradientBackgroundImage(colors);

  // // Ensure the correct number of colors are present
  expect((backgroundImage.match(/rgba/g) || []).length).toBe(colors.length);

  // // Match colors
  expect(backgroundImage).toMatchSnapshot();
});

it(`computes the correct gradient background image for a complex set of props`, () => {
  const colors = ['red', 'rgba(0,255,255,0)'];
  const startPoint: [number, number] = [0, 0];
  const endPoint: [number, number] = [1, 1];
  const locations = [0.5, 1];
  const backgroundImage = getLinearGradientBackgroundImage(colors, locations, startPoint, endPoint);

  expect(backgroundImage).toMatchSnapshot();
});
