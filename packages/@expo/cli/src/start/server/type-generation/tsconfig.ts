import JsonFile, { JSONObject } from '@expo/json-file';
import chalk from 'chalk';
import path from 'path';

import { Log } from '../../../log';

/**
 * Force updates a project tsconfig with Expo values.
 */
export async function forceUpdateTSConfig(projectRoot: string) {
  // This runs after the TypeScript prerequisite, so we know the tsconfig.json exists
  const tsConfigPath = path.join(projectRoot, 'tsconfig.json');
  const { tsConfig, updates } = getTSConfigUpdates(
    JsonFile.read(tsConfigPath, {
      json5: true,
    })
  );

  await writeUpdates(tsConfigPath, tsConfig, updates);
}

export function getTSConfigUpdates(tsConfig: JSONObject) {
  const updates = new Set<string>();

  if (!tsConfig.include) {
    tsConfig.include = ['**/*.ts', '**/*.tsx', '.expo/types/**/*.ts'];
    updates.add('include');
  } else if (Array.isArray(tsConfig.include)) {
    if (!tsConfig.include.includes('.expo/types/**/*.ts')) {
      tsConfig.include = [...tsConfig.include, '.expo/types/**/*.ts'];
      updates.add('include');
    }
  }

  return { tsConfig, updates };
}

export async function forceRemovalTSConfig(projectRoot: string) {
  // This runs after the TypeScript prerequisite, so we know the tsconfig.json exists
  const tsConfigPath = path.join(projectRoot, 'tsconfig.json');
  const { tsConfig, updates } = getTSConfigRemoveUpdates(
    JsonFile.read(tsConfigPath, {
      json5: true,
    })
  );

  await writeUpdates(tsConfigPath, tsConfig, updates);
}

export function getTSConfigRemoveUpdates(tsConfig: JSONObject) {
  const updates = new Set<string>();

  if (Array.isArray(tsConfig.include) && tsConfig.include.includes('.expo/types/**/*.ts')) {
    tsConfig.include = tsConfig.include.filter((i) => (i as string) !== '.expo/types/**/*.ts');
    updates.add('include');
  }

  return { tsConfig, updates };
}

async function writeUpdates(tsConfigPath: string, tsConfig: JSONObject, updates: Set<string>) {
  if (updates.size) {
    await JsonFile.writeAsync(tsConfigPath, tsConfig);
    for (const update of updates) {
      Log.log(
        chalk`{bold TypeScript}: The {cyan tsconfig.json#${update}} property has been updated`
      );
    }
  }
}
