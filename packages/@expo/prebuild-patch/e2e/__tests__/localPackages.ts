import spawnAsync from '@expo/spawn-async';
import fs from 'fs/promises';
import path from 'path';

const EXPO_DIR = path.join(__dirname, '../../../../..');

export async function addLinkedPackagesAsync(projectRoot: string, packages: string[]) {
  for (const pkg of packages) {
    const pkgRoot = path.join(EXPO_DIR, 'packages', pkg);
    await spawnAsync('bun', ['link'], { cwd: pkgRoot });
    await spawnAsync('bun', ['link', pkg], { cwd: projectRoot });
  }
}

export async function overwriteLocalPackagesFilesAsync(projectRoot: string, packages: string[]) {
  for (const pkg of packages) {
    const pkgRoot = path.join(EXPO_DIR, 'packages', pkg);
    await fs.cp(path.join(pkgRoot, 'build'), path.join(projectRoot, 'node_modules', pkg, 'build'), {
      force: true,
      recursive: true,
    });
  }
}
