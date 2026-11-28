import { jest } from '@jest/globals';

import { axe, renderWithTestRouter } from '~/common/test-utilities';

import { Footer } from './Footer';
import { githubUrl } from './utils';

describe('Footer', () => {
  beforeAll(() => {
    globalThis.fetch = jest.fn(() => new Promise<Response>(() => {}));
  });

  test('has no axe violations', async () => {
    const router = { pathname: '/sdk/' };
    const { container } = renderWithTestRouter(<Footer title="test-title" />, router);
    expect(await axe(container)).toHaveNoViolations();
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
