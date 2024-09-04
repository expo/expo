export function join(...paths: string[]) {
  return paths.join('/');
}

export const separator = '/';

export function dirname(path: string) {
  if (path.endsWith('/')) {
    return path;
  }
  return `${path.split('/').slice(0, -1).join('/')}/`;
}

export function basename(path: string, suffix?: string) {
  const pathWithoutTrailingSeparator = path.endsWith('/') ? path.slice(0, -1) : path;
  const basename = pathWithoutTrailingSeparator.split('/').pop() || '';
  if (!suffix) {
    return basename;
  }
  if (basename.endsWith(suffix)) {
    return basename.slice(0, -suffix.length);
  }
  return basename;
}

export function extname(path: string) {
  const base = basename(path);
  const lastDotIndex = base.lastIndexOf('.');
  if (lastDotIndex === -1) {
    return '';
  }
  return base.slice(lastDotIndex + 1);
}
