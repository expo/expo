/**
 * @jest-environment jsdom
 */

import { render } from '@testing-library/react';
import React from 'react';

import { StatusBar as ExpoStatusBar } from '../StatusBar';

it('renders null', () => {
  const result = render(<ExpoStatusBar />);
  expect(result.container).toMatchInlineSnapshot(`<div />`);
});
