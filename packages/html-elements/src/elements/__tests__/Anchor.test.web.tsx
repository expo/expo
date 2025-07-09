import { render, screen } from '@testing-library/react';
import * as React from 'react';

import { A } from '../Anchor';

it('renders A', () => {
  render(<A href="#" target="_parent" />);

  const anchor = screen.getByRole('link');
  expect(anchor).toBeDefined();
});
