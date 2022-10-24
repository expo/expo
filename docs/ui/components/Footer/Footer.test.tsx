import { render } from '@testing-library/react';
import { RouterContext } from 'next/dist/shared/lib/router-context';
import { NextRouter } from 'next/router';
import * as React from 'react';

import { Footer } from './Footer';
import { githubUrl } from './utils';

const withTestRouter = (tree: React.ReactElement, router: Partial<NextRouter> = {}) => (
  <RouterContext.Provider value={router as NextRouter}>{tree}</RouterContext.Provider>
);

describe('DocumentationFooter', () => {
  test('displays default links', () => {
    const router = { asPath: '/', pathname: '/example/' };
    const { container } = render(withTestRouter(<Footer title="test-title" />, router));

    expect(container).toHaveTextContent('Ask a question on the forums');
    expect(container).toHaveTextContent('Edit this page');
  });

  test('displays forums link with tag', () => {
    const router = { asPath: '/sdk/', pathname: '' };
    const { container } = render(withTestRouter(<Footer title="test-title" />, router));

    expect(container).toHaveTextContent('Ask a question on the forums about test-title');
  });

  test('displays issues link', () => {
    const router = { asPath: '/sdk/', pathname: '' };
    const { container } = render(withTestRouter(<Footer title="test-title" />, router));

    expect(container).toHaveTextContent('View open bug reports for test-title');
  });

  test('displays source code link', () => {
    const router = { asPath: '/sdk/', pathname: '' };
    const { container } = render(
      withTestRouter(<Footer title="test-title" sourceCodeUrl="/" />, router)
    );

    expect(container).toHaveTextContent('View source code for test-title');
  });
});

describe('githubUrl', () => {
  const EDIT_URL_PREFIX = 'https://github.com/expo/expo/edit/main/docs/pages';

  test('non-versioned page', () => {
    expect(githubUrl('/guides')).toBe(EDIT_URL_PREFIX + '/guides.mdx');
  });

  test('nested non-versioned page', () => {
    expect(githubUrl('/build/introduction')).toBe(EDIT_URL_PREFIX + '/build/introduction.mdx');
  });

  test('versioned index page', () => {
    expect(githubUrl('/versions/v42.0.0')).toBe(EDIT_URL_PREFIX + '/versions/v42.0.0/index.mdx');
  });

  test('nested versioned page', () => {
    expect(githubUrl('/versions/v42.0.0/sdk/av')).toBe(
      EDIT_URL_PREFIX + '/versions/v42.0.0/sdk/av.mdx'
    );
  });

  test('latest index page', () => {
    expect(githubUrl('/versions/latest')).toBe(EDIT_URL_PREFIX + '/versions/unversioned/index.mdx');
  });

  test('nested latest page', () => {
    expect(githubUrl('/versions/latest/sdk/av')).toBe(
      EDIT_URL_PREFIX + '/versions/unversioned/sdk/av.mdx'
    );
  });

  test('unversioned index page', () => {
    expect(githubUrl('/versions/unversioned')).toBe(
      EDIT_URL_PREFIX + '/versions/unversioned/index.mdx'
    );
  });

  test('nested unversioned page', () => {
    expect(githubUrl('/versions/unversioned/sdk/av')).toBe(
      EDIT_URL_PREFIX + '/versions/unversioned/sdk/av.mdx'
    );
  });
});
