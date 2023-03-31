import JsonFile from '@expo/json-file';
import path from 'path';

import { fileExistsAsync } from '../dir';
import { evaluateTsConfig, importTypeScriptFromProjectOptionally } from './evaluateTsConfig';

export type TsConfigPaths = {
  paths?: Record<string, string[]>;
  baseUrl: string;
};

type ConfigReadResults = [
  string,
  {
    compilerOptions?: {
      baseUrl?: string;
      paths?: Record<string, string[]>;
    };
  }
];

const debug = require('debug')('expo:utils:tsconfig:load') as typeof console.log;

export async function loadTsConfigPathsAsync(dir: string): Promise<TsConfigPaths | null> {
  const options = (await readTsconfigAsync(dir)) ?? (await readJsconfigAsync(dir));
  if (options) {
    const [filepath, config] = options;
    if (config.compilerOptions?.baseUrl) {
      return {
        paths: config.compilerOptions?.paths,
        baseUrl: path.resolve(dir, config.compilerOptions.baseUrl),
      };
    }
    debug(`No baseUrl found in ${filepath}`);
    return {
      paths: config.compilerOptions?.paths,
      baseUrl: dir,
    };
  }
  return null;
}

async function readJsconfigAsync(projectRoot: string): Promise<null | ConfigReadResults> {
  const configPath = path.join(projectRoot, 'jsconfig.json');
  if (await fileExistsAsync(configPath)) {
    const config = await JsonFile.readAsync(configPath, { json5: true });
    if (config) {
      return [configPath, config];
    }
  }
  return null;
}

// TODO: Refactor for speed
async function readTsconfigAsync(projectRoot: string): Promise<null | ConfigReadResults> {
  const configPath = path.join(projectRoot, 'tsconfig.json');
  if (await fileExistsAsync(configPath)) {
    // We need to fully evaluate the tsconfig to get the baseUrl and paths in case they were applied in `extends`.
    const ts = importTypeScriptFromProjectOptionally(projectRoot);
    if (ts) {
      return [configPath, evaluateTsConfig(ts, configPath)];
    }
    debug(`typescript module not found in: ${projectRoot}`);
  }
  return null;
}
