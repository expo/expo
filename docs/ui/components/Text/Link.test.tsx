import { render, screen } from '@testing-library/react';
import React from 'react';

import { LinkBase } from './Link';

describe('Link', () => {
  test('renders <a> tag with correct external href', () => {
    const href = 'https://github.com/expo';
    render(<LinkBase href={href} />);

    expect(screen.getByRole('link')).toBeTruthy();
    expect(screen.getByRole('link').getAttribute('href')).toBe(href);
  });

  test('renders <a> tag with correct internal href', () => {
    const href = '/tools';
    render(<LinkBase href={href} />);

    expect(screen.getByRole('link')).toBeTruthy();
    expect(screen.getByRole('link')?.getAttribute('href')).toBe(href);
  });
});
