export function githubUrl(path: string) {
  if (path === '/versions/latest' || path === '/versions/unversioned') {
    path = '/versions/unversioned/index';
  } else if (path === '/eas' || path === '/eas/') {
    path = '/eas/index';
  } else if (path === '/feature-preview' || path === '/feature-preview/') {
    path = '/feature-preview/index';
  }

  if (path.includes('/versions/latest/')) {
    path = path.replace('/versions/latest/', '/versions/unversioned/');
  } else if (path.match(/v\d+\.\d+\.\d+\/?$/) || path === '/') {
    if (path[path.length - 1] === '/') {
      path = `${path}index`;
    } else {
      path = `${path}/index`;
    }
  }

  const filePath =
    path.replace(/\/$/, '').replace('/versions/latest', '/versions/unversioned') + '.mdx';

  return `https://github.com/expo/expo/edit/main/docs/pages${filePath}`;
}
