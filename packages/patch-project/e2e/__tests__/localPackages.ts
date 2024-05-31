import spawnAsync from '@expo/spawn-async';
import path from 'path';

const EXPO_DIR = path.join(__dirname, '../../../..');

export async function addLinkedPackagesAsync(projectRoot: string, packages: string[]) {
  for (const pkg of packages) {
    const pkgRoot = path.join(EXPO_DIR, 'packages', pkg);
    await spawnAsync('bun', ['link'], { cwd: pkgRoot });
    await spawnAsync('bun', ['link', pkg], { cwd: projectRoot });
  }
}

export async function packBareTemplateTarballAsync(outputRoot: string): Promise<string> {
  const { stdout } = await spawnAsync('npm', ['pack', '--json', '--pack-destination', outputRoot], {
    cwd: path.join(EXPO_DIR, 'templates', 'expo-template-bare-minimum'),
  });
  const outputJson = JSON.parse(stdout);
  return path.join(outputRoot, outputJson[0].filename);
}
