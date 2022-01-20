import JsonFile from '@expo/json-file';
import chalk from 'chalk';

import * as Log from '../../log';
import { EXPO_NO_TYPESCRIPT_SETUP } from '../../utils/env';
import { baseTSConfigName, resolveBaseTSConfig } from './resolveModules';

export async function updateTSConfigAsync({
  projectRoot,
  tsConfigPath,
  isBootstrapping,
}: {
  projectRoot: string;
  tsConfigPath: string;
  isBootstrapping: boolean;
}): Promise<void> {
  if (isBootstrapping) {
    await JsonFile.writeAsync(tsConfigPath, {});
  }

  const projectTSConfig = JsonFile.read(tsConfigPath, {
    // Some tsconfig.json files have a generated comment in the file.
    json5: true,
  });
  if (projectTSConfig.compilerOptions == null) {
    projectTSConfig.compilerOptions = {};
    isBootstrapping = true;
  }

  const modifications: [string, string][] = [];

  // If the default TSConfig template exists (SDK +41), then use it in the project
  const hasTemplateTsconfig = resolveBaseTSConfig(projectRoot);
  if (hasTemplateTsconfig) {
    // If the extends field isn't defined, set it to the expo default
    if (!projectTSConfig.extends) {
      // if (projectTSConfig.extends !== baseTSConfigName) {
      projectTSConfig.extends = baseTSConfigName;
      modifications.push(['extends', baseTSConfigName]);
    }
  } else if (isBootstrapping) {
    // use an unversioned config when the versioned config cannot be resolved
    projectTSConfig.compilerOptions = {
      jsx: 'react-native',
      target: 'esnext',
      lib: ['esnext'],
      allowJs: true,
      skipLibCheck: true,
      noEmit: true,
      allowSyntheticDefaultImports: true,
      resolveJsonModule: true,
      esModuleInterop: true,
      moduleResolution: 'node',
    };
    modifications.push(['compilerOptions', 'configured']);
  }

  // If no changes, then quietly bail out
  if (!modifications.length) {
    return;
  }

  // Write changes and log out a summary of what changed
  await JsonFile.writeAsync(tsConfigPath, projectTSConfig);

  Log.log();

  if (isBootstrapping) {
    Log.log(`${chalk.bold`TypeScript`}: A ${chalk.cyan('tsconfig.json')} has been auto-generated`);
  } else {
    Log.log(
      `${chalk.bold`TypeScript`}: The ${chalk.cyan(
        'tsconfig.json'
      )} has been updated ${chalk.dim`(Use ${EXPO_NO_TYPESCRIPT_SETUP} to skip)`}`
    );
    logModifications(modifications);
  }
  Log.log();
}

function logModifications(modifications: string[][]) {
  Log.log();

  Log.log(
    `\u203A ${chalk.bold('Required')} modifications made to the ${chalk.cyan('tsconfig.json')}:`
  );

  Log.log();

  // Sort the items based on key name length
  printTable(modifications.sort((a, b) => a[0].length - b[0].length));

  Log.log();
}

function printTable(items: string[][]) {
  const tableFormat = (name: string, msg: string) =>
    `  ${chalk.bold`${name}`} is now ${chalk.cyan(msg)}`;
  for (const [key, value] of items) {
    Log.log(tableFormat(key, value));
  }
}
