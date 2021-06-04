import findUp from 'find-up';
import * as path from 'path';
import resolveFrom from 'resolve-from';

export function resolvePackageRootFolder(fromDirectory: string, moduleId: string): string | null {
  const resolved = resolveFrom.silent(fromDirectory, moduleId);
  if (!resolved) return null;
  // Get the closest package.json to the node module
  const packageJson = findUp.sync('package.json', { cwd: resolved });
  if (!packageJson) return null;
  // resolve the root folder for the node module
  return path.dirname(packageJson);
}
