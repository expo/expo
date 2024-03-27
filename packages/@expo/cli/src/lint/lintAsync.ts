import JsonFile, { type JSONObject } from '@expo/json-file';
import * as PackageManager from '@expo/package-manager';
import spawnAsync from '@expo/spawn-async';
import fs from 'fs/promises';
import path from 'path';

import { Log } from '../log';
import { selectAsync } from '../utils/prompts';

const WITH_PRETTIER = `module.exports = {
  root: true,
  extends: ["universe/native", "prettier"],
  plugins: ["prettier", "expo"],
  rules: {
    "prettier/prettier": ["warn"],
    "expo/no-env-var-destructuring": ["error"],
    "expo/no-dynamic-env-var": ["error"],
  },
};

`;

const ESLINT_ONLY = `module.exports = {
  root: true,
  extends: ["universe/native"],
  plugins: ["expo"],
  rules: {
    "expo/no-env-var-destructuring": ["error"],
    "expo/no-dynamic-env-var": ["error"],
  },
};
`;

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

  const packages = [
    'eslint',
    'eslint-plugin-expo',
    'eslint-config-universe', // TODO(Kadi): eslit-config-expo once published
  ];

  if (result === 'eslint-and-prettier') {
    packages.push('prettier');
    packages.push('eslint-config-prettier');
    packages.push('eslint-plugin-prettier');
  }

  const manager = PackageManager.createForProject(projectRoot);

  // TODO(Kadi): how to add this as dev dependencies?
  await manager.addAsync(packages);

  await fs.writeFile(
    path.join(projectRoot, '.eslintrc.js'),
    result === 'eslint' ? ESLINT_ONLY : WITH_PRETTIER,
    'utf8'
  );

  if (result === 'eslint-and-prettier') {
    await fs.writeFile(path.join(projectRoot, '.prettierrc'), '{}', 'utf8');
  }

  const scripts = JsonFile.read(path.join(projectRoot, 'package.json')).scripts;

  if ((scripts as JSONObject)?.lint) {
    Log.log('Skipped adding the lint scrip as one exists already');
  } else {
    await JsonFile.setAsync(
      path.join(projectRoot, 'package.json'),
      'scripts',
      typeof scripts === 'object' ? { ...scripts, lint: 'eslint .' } : { lint: 'eslint .' },
      { json5: false }
    );
  }

  Log.log();
  Log.log('Your eslint config has been set up 🎉');
  Log.log('Run "npx expo lint" again to lint your code');
};

export const lintAsync = async (projectRoot: string) => {
  try {
    // TODO(Kadi): check for all config files https://eslint.org/docs/latest/use/configure/configuration-files#configuration-file-formats
    await fs.readFile(path.join(projectRoot, '.eslintrc.js'), 'utf8');
  } catch {
    return setupLinting(projectRoot);
  }

  const packageManager = PackageManager.resolvePackageManager(projectRoot) || 'npm';

  // TODO(Kadi): check if there's a lint command first?
  const commands = packageManager === 'npm' ? ['run', 'lint'] : ['lint'];

  await spawnAsync(packageManager, commands, {
    stdio: 'inherit',
    cwd: projectRoot,
  });
};
