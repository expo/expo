import * as PackageManager from '@expo/package-manager';
import spawnAsync from '@expo/spawn-async';
import fs from 'fs/promises';
import path from 'path';

import { selectAsync } from '../utils/prompts';

export const lintAsync = async (projectRoot: string) => {
  console.log('projectRoot, ', projectRoot);
  try {
    await fs.readFile(path.join(projectRoot, '.eslintrc.js '), 'utf8');
  } catch {
    const result = await selectAsync(
      'No eslint config found. Would you like to set up linting for this project?',
      [
        {
          title: 'Yes, eslint only',
          value: 'eslint',
        },
        {
          title: 'Yes, eslint and prettier',
          value: 'eslint-and-prettier',
        },
        {
          title: 'No',
          value: 'no',
        },
      ]
    );

    if (result === 'no') {
      return;
    }
    console.log('result', result);

    return;
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
