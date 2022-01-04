import assert from 'assert';
import findUp from 'find-up';
import path from 'path';
import resolveFrom from 'resolve-from';

/**
 * Find the closest `package.json`.
 *
 * @example findUpPackageJson('./foo/expo/build/index.js') -> './foo/expo/package.json'
 */
function findUpPackageJson(root: string): string {
  const packageJson = findUp.sync('package.json', { cwd: root });
  assert(packageJson, `No package.json found for module "${root}"`);
  return packageJson;
}

/**
 * Return the root folder for a node module file.
 *
 * @example getModuleRootPathForFile('./foo/expo/build/index.js') -> './foo/expo'
 */
function getModuleRootPathForFile(moduleFile: string): string {
  // Get the closest package.json to the node module
  const packageJson = findUpPackageJson(moduleFile);
  const moduleRoot = path.dirname(packageJson);
  return moduleRoot;
}

/**
 * Return true if the parent folder for a given file path is named "node_modules".
 *
 * @example
 * isModuleRootPathInNodeModulesFolder('./foo/expo') -> false
 * isModuleRootPathInNodeModulesFolder('./node_modules/expo') -> true
 */
function isModuleRootPathInNodeModulesFolder(moduleRootPath: string): boolean {
  const parentFolderName = path.basename(path.dirname(moduleRootPath));
  return parentFolderName === 'node_modules';
}

/**
 * Given a node module name, and a project path, this method will:
 *
 * 1. Resolve the module path.
 * 2. Find the module root folder.
 * 3. Return true if the module root folder is in a folder named `node_modules`
 *
 * @param projectRoot
 * @param moduleId
 *
 * @example
 * isModuleSymlinked({
 *   projectRoot: './expo/apps/native-component-list',
 *   moduleId: 'react-native'
 * })
 */
export function isModuleSymlinked({
  projectRoot,
  moduleId,
  isSilent,
}: {
  projectRoot: string;
  moduleId: string;
  isSilent?: boolean;
}): boolean {
  try {
    const modulePath = resolveFrom(projectRoot, moduleId);
    if (!modulePath) {
      // module cannot be resolved (probably not installed), cannot be symlinked.
      return false;
    }
    // resolve the root folder for the node module
    const moduleRootPath = getModuleRootPathForFile(modulePath);
    return !isModuleRootPathInNodeModulesFolder(moduleRootPath);
  } catch (error) {
    if (!isSilent) {
      throw error;
    }
    // Failed to resolve the package.json relative to the project, not sure what to do here.
    // This is probably not possible due to node module resolution.
    return false;
  }
}
