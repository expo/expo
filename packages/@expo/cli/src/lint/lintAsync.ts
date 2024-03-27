import * as PackageManager from '@expo/package-manager';
import spawnAsync from '@expo/spawn-async';
import fs from 'fs/promises';
import path from 'path';

export const lintAsync = async (projectRoot: string) => {
  console.log('projectRoot, ', projectRoot);
  try {
    await fs.readFile(path.join(projectRoot, '.eslintrc.js'), 'utf8');
  } catch {
    console.log('No eslint file found');
  }

  const packageManager = PackageManager.resolvePackageManager(projectRoot) || 'yarn';

  // TODO(Kadi): check if there's a lint command?
  const commands = packageManager === 'npm' ? ['run', 'lint'] : ['lint'];

  await spawnAsync(packageManager, commands, {
    stdio: 'inherit',
    cwd: projectRoot,
    env: { ...process.env },
  });
};
