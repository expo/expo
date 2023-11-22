import assert from 'assert';
import findUp from 'find-up';
import path from 'path';

function findUpPackageJson(root: string): string {
  const packageJson = findUp.sync('package.json', { cwd: root });
  assert(packageJson, `No package.json found for module "${root}"`);
  return packageJson;
}

export function normalizeProjectRoot(projectRoot?: string): string {
  return path.dirname(findUpPackageJson(projectRoot ?? process.cwd()));
}
