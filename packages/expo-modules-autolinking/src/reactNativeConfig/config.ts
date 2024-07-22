import fs from 'fs/promises';
import path from 'path';
import requireFromString from 'require-from-string';
import resolveFrom from 'resolve-from';

import type { RNConfigReactNativeConfig } from './reactNativeConfig.types';
import { fileExistsAsync } from './utils';

let tsMain: typeof import('typescript') | null | undefined = undefined;

/**
 * Load the `react-native.config.js` or `react-native.config.ts` from the package.
 */
export async function loadConfigAsync<T extends RNConfigReactNativeConfig>(
  packageRoot: string
): Promise<T | null> {
  const configJsPath = path.join(packageRoot, 'react-native.config.js');
  if (await fileExistsAsync(configJsPath)) {
    try {
      return require(configJsPath);
    } catch {
      return null;
    }
  }

  const configTsPath = path.join(packageRoot, 'react-native.config.ts');
  if (await fileExistsAsync(configTsPath)) {
    if (tsMain === undefined) {
      const tsPath = resolveFrom.silent(packageRoot, 'typescript');
      if (tsPath) {
        tsMain = require(tsPath);
      }
    } else if (tsMain == null) {
      return null;
    }

    const configContents = await fs.readFile(configTsPath, 'utf8');
    const transpiledContents = tsMain?.transpileModule(configContents, {
      compilerOptions: {
        module: tsMain.ModuleKind.NodeNext,
        moduleResolution: tsMain.ModuleResolutionKind.NodeNext,
        target: tsMain.ScriptTarget.ESNext,
      },
    });
    const outputText = transpiledContents?.outputText;
    let config;
    try {
      config = outputText ? requireFromString(outputText) : null;
    } catch {}
    return config?.default ?? config ?? null;
  }

  return null;
}
