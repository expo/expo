import assert from 'assert';
import findUp from 'find-up';
import fs from 'fs/promises';
import path from 'path';

export async function normalizeProjectRootAsync(
  projectRoot: string
): Promise<{ projectRoot: string; platformAndroid: boolean; platformIos: boolean }> {
  const root = path.dirname(findUpPackageJson(projectRoot));
  const platformAndroid = await pathExistsAsync(path.join(root, 'android'));
  const platformIos = await pathExistsAsync(path.join(root, 'ios'));
  return {
    projectRoot: root,
    platformAndroid,
    platformIos,
  };
}

function findUpPackageJson(root: string): string {
  const packageJson = findUp.sync('package.json', { cwd: root });
  assert(packageJson, `No package.json found for module "${root}"`);
  return packageJson;
}

async function pathExistsAsync(filePath: string): Promise<boolean> {
  try {
    await fs.stat(filePath);
    return true;
  } catch {
    return false;
  }
}
