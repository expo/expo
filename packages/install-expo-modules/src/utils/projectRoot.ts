import assert from 'assert';
import fs from 'fs';
import path from 'path';

export async function normalizeProjectRootAsync(
  projectRoot: string
): Promise<{ projectRoot: string; platformAndroid: boolean; platformIos: boolean }> {
  const root = path.dirname(await findUpPackageJson(projectRoot));
  const platformAndroid = await pathExistsAsync(path.join(root, 'android'));
  const platformIos = await pathExistsAsync(path.join(root, 'ios'));
  return {
    projectRoot: root,
    platformAndroid,
    platformIos,
  };
}

async function findUpPackageJson(root: string): Promise<string> {
  let packageJson: string | null = null;
  for (let dir = root; path.dirname(dir) !== dir; dir = path.dirname(dir)) {
    const file = path.resolve(dir, 'package.json');
    if (await pathExistsAsync(file)) {
      packageJson = file;
      break;
    }
  }
  assert(packageJson, `No package.json found for module "${root}"`);
  return packageJson;
}

async function pathExistsAsync(filePath: string): Promise<boolean> {
  try {
    await fs.promises.stat(filePath);
    return true;
  } catch {
    return false;
  }
}
