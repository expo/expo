import JsonFile from '@expo/json-file';
import resolveFrom from 'resolve-from';

import { CommandError } from '../../../utils/errors';

export async function resolvePackageVersionAsync(
  projectRoot: string,
  packageName: string
): Promise<string> {
  let packageJsonPath: string | undefined;
  try {
    packageJsonPath = resolveFrom(projectRoot, `${packageName}/package.json`);
  } catch (error: any) {
    // This is a workaround for packages using `exports`. If this doesn't
    // include `package.json`, we have to use the error message to get the location.
    if (error.code === 'ERR_PACKAGE_PATH_NOT_EXPORTED') {
      packageJsonPath = error.message.match(/("exports"|defined) in (.*)$/i)?.[2];
    }
  }
  if (!packageJsonPath) {
    throw new CommandError(
      'PACKAGE_NOT_FOUND',
      `"${packageName}" is added as a dependency in your project's package.json but it doesn't seem to be installed. Please run "yarn" or "npm install" to fix this issue.`
    );
  }
  const packageJson = await JsonFile.readAsync<{ version: string }>(packageJsonPath);
  return packageJson.version;
}

export async function resolveAllPackageVersionsAsync(projectRoot: string, packages: string[]) {
  const resolvedPackages = await Promise.all(
    packages.map(async (packageName) => [
      packageName,
      await resolvePackageVersionAsync(projectRoot, packageName),
    ])
  );

  return Object.fromEntries(resolvedPackages);
}
