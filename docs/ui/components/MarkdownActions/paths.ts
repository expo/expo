const DYNAMIC_DATA_PATHS = [
  /^\/additional-resources\/?$/,
  /^\/archive(\/.*)?$/,
  /^\/bare\/upgrade\/?$/,
];

const UPGRADE_HELPER_PATH = '/bare/upgrade';
const SDK_VERSION_PARAM = /^(\d+|unversioned)$/;

export function normalizePath(path?: string) {
  if (!path) {
    return '';
  }

  const [cleanPath] = path.split(/[#?]/);
  return cleanPath.replace(/\/+$/, '') || '/';
}

export function hasDynamicData(path?: string) {
  const normalized = normalizePath(path);
  return normalized ? DYNAMIC_DATA_PATHS.some(pattern => pattern.test(normalized)) : false;
}

function versionRank(version: string) {
  return version === 'unversioned' ? Number.POSITIVE_INFINITY : Number(version);
}

export function getVersionedMarkdownPath(path?: string) {
  if (!path || normalizePath(path) !== UPGRADE_HELPER_PATH) {
    return null;
  }

  const query = path.split('#')[0].split('?')[1];
  if (!query) {
    return null;
  }

  const params = new URLSearchParams(query);
  const from = params.get('fromSdk');
  const to = params.get('toSdk');
  if (
    !from ||
    !to ||
    !SDK_VERSION_PARAM.test(from) ||
    !SDK_VERSION_PARAM.test(to) ||
    versionRank(from) >= versionRank(to)
  ) {
    return null;
  }

  return `${UPGRADE_HELPER_PATH}/${from}-to-${to}/index.md`;
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

  if (getVersionedMarkdownPath(path)) {
    return true;
  }

  return !hasDynamicData(path);
}
