import JsonFile from '@expo/json-file';
import chalk from 'chalk';
import fs from 'fs';

import * as Log from '../../../log';

export const baseTSConfigName = 'expo/tsconfig.base';

export async function updateTSConfigAsync({
  tsConfigPath,
}: {
  tsConfigPath: string;
}): Promise<void> {
  const shouldGenerate = !fs.existsSync(tsConfigPath) || fs.statSync(tsConfigPath).size === 0;
  if (shouldGenerate) {
    await JsonFile.writeAsync(tsConfigPath, { compilerOptions: {} });
  }

  const projectTSConfig = JsonFile.read(tsConfigPath, {
    // Some tsconfig.json files have a generated comment in the file.
    json5: true,
  });

  projectTSConfig.compilerOptions ??= {};

  const modifications: [string, string][] = [];

  // If the extends field isn't defined, set it to the expo default
  if (!projectTSConfig.extends) {
    // if (projectTSConfig.extends !== baseTSConfigName) {
    projectTSConfig.extends = baseTSConfigName;
    modifications.push(['extends', baseTSConfigName]);
  }

  // If no changes, then quietly bail out
  if (!modifications.length) {
    return;
  }

  // Write changes and log out a summary of what changed
  await JsonFile.writeAsync(tsConfigPath, projectTSConfig);

  // If no changes, then quietly bail out
  if (modifications.length === 0) {
    return;
  }

  Log.log();

  if (shouldGenerate) {
    Log.log(chalk`{bold TypeScript}: A {cyan tsconfig.json} has been auto-generated`);
  } else {
    Log.log(
      chalk`{bold TypeScript}: The {cyan tsconfig.json} has been updated {dim (Use EXPO_NO_TYPESCRIPT_SETUP to skip)}`
    );
    logModifications(modifications);
  }
  Log.log();
}

function logModifications(modifications: string[][]) {
  Log.log();

  Log.log(chalk`\u203A {bold Required} modifications made to the {cyan tsconfig.json}:`);

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
