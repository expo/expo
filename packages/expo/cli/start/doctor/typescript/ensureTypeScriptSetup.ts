import chalk from 'chalk';
import fs from 'fs/promises';
import path from 'path';

import * as Log from '../../../log';
import { fileExistsAsync } from '../../../utils/dir';
import { EXPO_NO_TYPESCRIPT_SETUP } from '../../../utils/env';
import { everyMatchAsync, wrapGlobWithTimeout } from '../../../utils/glob';
import { profile } from '../../../utils/profile';
import { ensureDependenciesAsync } from '../dependencies/ensureDependenciesAsync';
import { updateTSConfigAsync } from './updateTSConfig';

export async function ensureTypeScriptSetupAsync(projectRoot: string): Promise<void> {
  if (EXPO_NO_TYPESCRIPT_SETUP()) {
    Log.log(chalk.dim('\u203A Skipping TypeScript verification'));
    return;
  }

  const tsConfigPath = path.join(projectRoot, 'tsconfig.json');

  // Ensure the project is TypeScript before continuing.
  const intent = await shouldSetupTypeScriptAsync(projectRoot);
  if (!intent) {
    return;
  }

  // Ensure TypeScript packages are installed
  await ensureRequiredDependenciesAsync(projectRoot);

  // Update the config
  await updateTSConfigAsync({ tsConfigPath, isBootstrapping: intent.isBootstrapping });
}

export async function shouldSetupTypeScriptAsync(projectRoot: string): Promise<{
  /** Indicates that TypeScript support is being bootstrapped. */
  isBootstrapping: boolean;
} | null> {
  const tsConfigPath = await hasTSConfig(projectRoot);

  // Enable TS setup if the project has a `tsconfig.json`
  if (tsConfigPath) {
    const content = await fs.readFile(tsConfigPath, { encoding: 'utf8' }).then(
      (txt) => txt.trim(),
      // null when the file doesn't exist.
      () => null
    );
    const isBlankConfig = content === '' || content === '{}';
    console.log('isBlankConfig', tsConfigPath, content);
    return { isBootstrapping: isBlankConfig };
  }
  // This is a somewhat heavy check in larger projects.
  // Test that this is reasonably paced by running expo start in `expo/apps/native-component-list`
  const typescriptFile = await profile(queryFirstProjectTypeScriptFileAsync)(projectRoot);
  if (typescriptFile) {
    return { isBootstrapping: true };
  }

  return null;
}

async function ensureRequiredDependenciesAsync(projectRoot: string): Promise<boolean> {
  return await ensureDependenciesAsync(projectRoot, {
    installMessage: `It looks like you're trying to use TypeScript but don't have the required dependencies installed.`,
    warningMessage:
      "If you're not using TypeScript, please remove the TypeScript files from your project",
    requiredPackages: [
      // use typescript/package.json to skip node module cache issues when the user installs
      // the package and attempts to resolve the module in the same process.
      { file: 'typescript/package.json', pkg: 'typescript' },
      { file: '@types/react/index.d.ts', pkg: '@types/react' },
      { file: '@types/react-native/index.d.ts', pkg: '@types/react-native' },
    ],
  });
}

async function queryFirstProjectTypeScriptFileAsync(projectRoot: string): Promise<null | string> {
  const results = await wrapGlobWithTimeout(
    () =>
      everyMatchAsync('**/*.@(ts|tsx)', {
        cwd: projectRoot,
        ignore: [
          '**/@(Carthage|Pods|node_modules)/**',
          '**/*.d.ts',
          '@(ios|android|web|web-build|dist)/**',
        ],
      }),
    5000
  );

  if (results === false) {
    return null;
  }
  return results[0] ?? null;
}

async function hasTSConfig(projectRoot: string): Promise<string | null> {
  const tsConfigPath = path.join(projectRoot, 'tsconfig.json');
  if (await fileExistsAsync(tsConfigPath)) {
    return tsConfigPath;
  }
  return null;
}
