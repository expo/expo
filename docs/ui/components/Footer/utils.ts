const DOCS_PAGES_ROOT = 'docs/pages';

export function getPageMdxFilePath(path: string) {
  if (!path) {
    return '';
  }

  if (path === '/versions/latest' || path === '/versions/unversioned') {
    path = '/versions/unversioned/index';
  } else if (path === '/eas' || path === '/eas/') {
    path = '/eas/index';
  } else if (path === '/feature-preview' || path === '/feature-preview/') {
    path = '/feature-preview/index';
  }

  if (path.includes('/versions/latest/')) {
    path = path.replace('/versions/latest/', '/versions/unversioned/');
  } else if (/v\d+\.\d+\.\d+\/?$/.test(path) || path === '/') {
    path = path.at(-1) === '/' ? `${path}index` : `${path}/index`;
  }

  return path.replace(/\/$/, '').replace('/versions/latest', '/versions/unversioned') + '.mdx';
}

export function githubUrl(path: string) {
  const filePath = getPageMdxFilePath(path);
  return `https://github.com/expo/expo/edit/main/${DOCS_PAGES_ROOT}${filePath}`;
}

export function githubRawUrl(path: string) {
  const filePath = getPageMdxFilePath(path);
  return `https://raw.githubusercontent.com/expo/expo/main/${DOCS_PAGES_ROOT}${filePath}`;
}
