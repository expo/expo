import JsonFile from '@expo/json-file';
import resolveFrom from 'resolve-from';

type PackageJson = {
  repository?: string | { url?: string };
};

// Explicit Expo-managed package names that don't use the @expo/* scope.
const EXPO_MANAGED_PACKAGE_NAMES = new Set(['expo', 'jest-expo']);

function getRepositoryUrl(repository?: PackageJson['repository']): string | null {
  if (!repository) {
    return null;
  }
  if (typeof repository === 'string') {
    return repository;
  }
  return repository.url ?? null;
}

function isExpoRepositoryUrl(repositoryUrl: string | null): boolean {
  if (!repositoryUrl) {
    return false;
  }

  // Support common npm repository URL formats:
  // - https://github.com/expo/<repo>(.git)
  // - git+https://github.com/expo/<repo>(.git)
  // - ssh://git@github.com/expo/<repo>(.git)
  // - git@github.com:expo/<repo>(.git)
  const normalizedUrl = repositoryUrl.replace(/^git\+/, '');

  try {
    const { hostname, pathname } = new URL(normalizedUrl);
    if (hostname.toLowerCase() !== 'github.com') {
      return false;
    }

    const [owner, rawRepo] = pathname.split('/').filter(Boolean);
    const repo = rawRepo?.replace(/\.git$/i, '');
    return owner?.toLowerCase() === 'expo' && !!repo;
  } catch {
    const sshMatch = normalizedUrl.match(/^git@github\.com:([^/]+)\/([^/]+?)(?:\.git)?$/i);
    if (!sshMatch) {
      return false;
    }

    const owner = sshMatch[1]?.toLowerCase();
    const repo = sshMatch[2];
    return owner === 'expo' && !!repo;
  }
}

export async function isExpoManagedDependencyAsync(
  projectRoot: string,
  packageName: string
): Promise<boolean> {
  // `@expo/*` is a trusted Expo namespace and does not require extra repository checks.
  if (packageName.startsWith('@expo/') || EXPO_MANAGED_PACKAGE_NAMES.has(packageName)) {
    return true;
  }

  const packageJsonPath = resolveFrom.silent(projectRoot, `${packageName}/package.json`);
  if (!packageJsonPath) {
    return false;
  }

  const packageJson = await JsonFile.readAsync<PackageJson>(packageJsonPath).catch(() => null);
  if (!packageJson) {
    return false;
  }

  return isExpoRepositoryUrl(getRepositoryUrl(packageJson.repository));
}
