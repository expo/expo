import path from 'path';
import resolveFrom from 'resolve-from';

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
 * isModuleSymlinked('./expo/apps/native-component-list', {
 *   moduleId: 'react-native'
 * })
 */
export function isModuleSymlinked(
  projectRoot: string,
  {
    moduleId,
    isSilent,
  }: {
    moduleId: string;
    isSilent?: boolean;
  }
): boolean {
  try {
    const moduleRootPath = path.dirname(resolveFrom(projectRoot, `${moduleId}/package.json`));
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
