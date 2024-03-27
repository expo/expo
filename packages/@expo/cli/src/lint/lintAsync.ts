import JsonFile from '@expo/json-file';
import * as PackageManager from '@expo/package-manager';
import spawnAsync from '@expo/spawn-async';
import fs from 'fs/promises';
import path from 'path';

import { selectAsync } from '../utils/prompts';

const setupLinting = async (projectRoot: string) => {
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

  const commandSegments = ['expo', 'install', 'eslint', 'eslint-config-expo'];

  if (result === 'eslint-and-prettier') {
    commandSegments.push('prettier');
  }

  // TODO(Kadi): how to add this as dev dependencies?
  await spawnAsync('npx', commandSegments, {
    stdio: 'inherit',
    cwd: projectRoot,
    env: { ...process.env },
  });

  await fs.writeFile(
    path.join(projectRoot, '.eslintrc.js'),
    `module.exports = {
  root: true,
  extends: [
    'expo',
  ],
};`,
    'utf8'
  );

  const scripts = JsonFile.read(path.join(projectRoot, 'package.json')).scripts;

  await JsonFile.setAsync(
    path.join(projectRoot, 'package.json'),
    'scripts',
    typeof scripts === 'object' ? { ...scripts, lint: 'eslint .' } : { lint: 'eslint .' },
    { json5: false }
  );
};

export const lintAsync = async (projectRoot: string) => {
  try {
    await fs.readFile(path.join(projectRoot, '.eslintrc.js '), 'utf8');
  } catch {
    return setupLinting(projectRoot);
  }

  const packageManager = PackageManager.resolvePackageManager(projectRoot) || 'yarn';

  // TODO(Kadi): check if there's a lint command first?
  const commands = packageManager === 'npm' ? ['run', 'lint'] : ['lint'];

  await spawnAsync(packageManager, commands, {
    stdio: 'inherit',
    cwd: projectRoot,
    env: { ...process.env },
  });
};
