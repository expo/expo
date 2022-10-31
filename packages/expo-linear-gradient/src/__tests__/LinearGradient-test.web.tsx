/**
 * @jest-environment jsdom
 */

import { render, getByTestId } from '@testing-library/react';
import React from 'react';

import { LinearGradient } from '../LinearGradient';

it(`renders a multi-color gradient background with alpha`, () => {
  const colors = ['cyan', '#ff00ff', 'rgba(0,0,0,0)', 'rgba(0,255,255,0.5)'];
  const component = render(<LinearGradient colors={colors} testID="gradient" />);
  const view = getByTestId(component.container, 'gradient');

  // TODO: figure out how to test this - not sure what the right way is to read
  // style properties when the styles are compiled into a css class as seen below
  expect(view).toMatchInlineSnapshot(`
    <div
      class="css-view-175oi2r"
      data-testid="gradient"
    />
  `);

  // const backgroundImage = view.style['backgroundImage'];

  // // Ensure the correct number of colors are present
  // expect((backgroundImage.match(/rgba/g) || []).length).toBe(colors.length);

  // // Match colors
  // expect(backgroundImage).toMatchSnapshot();
});

it(`renders a complex gradient with angles and locations`, () => {
  const component = render(
    <LinearGradient
      testID="gradient"
      colors={['red', 'rgba(0,255,255,0)']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      locations={[0.5, 1]}
    />
  );

  const view = getByTestId(component.container, 'gradient');

  // TODO: figure out how to test this - not sure what the right way is to read
  // style properties when the styles are compiled into a css class as seen below
  expect(view).toMatchInlineSnapshot(`
    <div
      class="css-view-175oi2r"
      data-testid="gradient"
    />
  `);

  // expect(getStyleProp(component.find('View'), 'backgroundImage')).toMatchSnapshot();
});
