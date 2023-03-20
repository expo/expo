import JsonFile from '@expo/json-file';
import chalk from 'chalk';
import path from 'path';

import { Log } from '../../../log';

/**
 * Force updates a project tsconfig with Expo values.
 */
export async function forceUpdateTSConfig(projectRoot: string, dotExpoDir: string) {
  // This runs after the TypeScript prerequisite, so we know the tsconfig.json exists
  const tsConfigPath = path.join(projectRoot, 'tsconfig.json');
  const tsConfig: any = JsonFile.read(tsConfigPath, {
    json5: true,
  });

  const generatedDeclarationFiles = path.relative(
    path.dirname(tsConfigPath),
    path.join(dotExpoDir, '/*')
  );

  const updates = new Set<string>();

  if (!tsConfig.include) {
    tsConfig.include = ['*', generatedDeclarationFiles];
    updates.add('include');
  } else if (!tsConfig.include.includes(generatedDeclarationFiles)) {
    tsConfig.include = [...tsConfig.include, generatedDeclarationFiles];
    updates.add('include');
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
