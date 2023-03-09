import { render, screen } from '@testing-library/react';
import { RouterContext } from 'next/dist/shared/lib/router-context';
import { NextRouter } from 'next/router';
import { ReactElement } from 'react';

import { Footer } from './Footer';
import { githubUrl } from './utils';

const withTestRouter = (tree: ReactElement, router: Partial<NextRouter> = {}) => (
  <RouterContext.Provider value={router as NextRouter}>{tree}</RouterContext.Provider>
);

describe('Footer', () => {
  test('displays default links', () => {
    const router = { pathname: '/example/' };
    render(withTestRouter(<Footer title="test-title" />, router));

    screen.getByText('Ask a question on the forums');
    screen.getByText('Edit this page');
  });

  test('displays forums link with tag', () => {
    const router = { pathname: '/sdk/' };
    render(withTestRouter(<Footer title="test-title" />, router));

    screen.getByText('Ask a question on the forums about test-title');
  });

  test('displays issues link', () => {
    const router = { pathname: '/sdk/' };
    render(withTestRouter(<Footer title="test-title" />, router));

    screen.getByText('View open bug reports for test-title');
  });

  test('displays correct issues link for 3rd-party package', () => {
    const router = { pathname: '/sdk/' };
    render(
      withTestRouter(
        <Footer
          title="GestureHandler"
          sourceCodeUrl="https://github.com/software-mansion/react-native-gesture-handler"
          packageName="react-native-gesture-handler"
        />,
        router
      )
    );

    const link = screen.getByRole('link', {
      name: 'View open bug reports for GestureHandler',
    });
    expect(link.getAttribute('href')).toBe(
      'https://github.com/software-mansion/react-native-gesture-handler/issues'
    );
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
