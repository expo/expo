import { jest } from '@jest/globals';
import { screen } from '@testing-library/react';

import Link from './next-link.cjs';
import { renderWithTestRouter } from './test-utilities';

describe('next-link shim', () => {
  it('keeps trailing slash for plain internal paths', () => {
    renderWithTestRouter(<Link href="/guides/overview/">Overview</Link>, {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
    });

    expect(screen.getByRole('link', { name: 'Overview' })).toHaveAttribute(
      'href',
      '/guides/overview/'
    );
  });

  it('preserves trailing slash before hash anchors', () => {
    renderWithTestRouter(<Link href="/deploy/web/#export-your-web-project/">Web guide</Link>, {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
    });

    expect(screen.getByRole('link', { name: 'Web guide' })).toHaveAttribute(
      'href',
      '/deploy/web/#export-your-web-project/'
    );
  });

  it('keeps trailing slash before query string', () => {
    renderWithTestRouter(<Link href="/guides/overview/?q=1">Search</Link>, {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
    });

    expect(screen.getByRole('link', { name: 'Search' })).toHaveAttribute(
      'href',
      '/guides/overview/?q=1'
    );
  });

  it('adds missing slash before hash anchors', () => {
    renderWithTestRouter(<Link href="/guides/overview#deep-link">Anchor</Link>, {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
    });

    expect(screen.getByRole('link', { name: 'Anchor' })).toHaveAttribute(
      'href',
      '/guides/overview/#deep-link'
    );
  });
});
