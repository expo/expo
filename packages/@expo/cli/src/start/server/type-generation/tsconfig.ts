import JsonFile from '@expo/json-file';
import chalk from 'chalk';
import path from 'path';

import { Log } from '../../../log';

/**
 * Force updates a project tsconfig with Expo values.
 */
export async function forceUpdateTSConfig(projectRoot: string) {
  // This runs after the TypeScript prerequisite, so we know the tsconfig.json exists
  const tsConfigPath = path.join(projectRoot, 'tsconfig.json');
  const tsConfig: any = JsonFile.read(tsConfigPath, {
    json5: true,
  });

  const updates = new Set<string>();

  if (!tsConfig.include) {
    tsConfig.include = ['**/*.ts', '**/*.tsx', '.expo/types/**/*.ts'];
    updates.add('include');
  } else {
    if (!tsConfig.include.includes('.expo/types/**/*.ts')) {
      tsConfig.include = [...tsConfig.include, '.expo/types/**/*.ts'];
      updates.add('include');
    }
  }

  if (updates.size) {
    await JsonFile.writeAsync(tsConfigPath, tsConfig);
    for (const update of updates) {
      Log.log(
        chalk`{bold TypeScript}: The {cyan tsconfig.json#${update}} property has been updated`
      );
    }
  }
}
