const DYNAMIC_DATA_PATHS = [/^\/additional-resources\/?$/];

export function normalizePath(path?: string) {
  if (!path) {
    return '';
  }

  const [cleanPath] = path.split('?');
  return cleanPath.replace(/\/+$/, '') || '/';
}

export function hasDynamicData(path?: string) {
  const normalized = normalizePath(path);
  return normalized ? DYNAMIC_DATA_PATHS.some(pattern => pattern.test(normalized)) : false;
}

export function shouldShowMarkdownActions({
  packageName,
  path,
}: {
  packageName?: string;
  path?: string;
}) {
  if (packageName) {
    return false;
  }

  return !hasDynamicData(path);
}
