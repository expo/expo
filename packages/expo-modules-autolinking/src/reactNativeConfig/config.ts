import fs from 'fs/promises';
import path from 'path';
import requireFromString from 'require-from-string';
import resolveFrom from 'resolve-from';

import { memoize, fileExistsAsync } from '../utils';
import type { RNConfigReactNativeConfig } from './reactNativeConfig.types';

let tsMain: typeof import('typescript') | null | undefined = undefined;

const mockedNativeModules = path.join(__dirname, '..', '..', 'node_modules_mock');

/**
 * Load the `react-native.config.js` or `react-native.config.ts` from the package.
 */
export const loadConfigAsync = memoize(async function loadConfigAsync<
  T extends RNConfigReactNativeConfig,
>(packageRoot: string): Promise<T | null> {
  const [configJsPath, configTsPath] = await Promise.all(
    ['react-native.config.js', 'react-native.config.ts'].map(async (fileName) => {
      const file = path.join(packageRoot, fileName);
      return (await fileExistsAsync(file)) ? file : null;
    })
  );
  if (configJsPath) {
    return requireConfig(configJsPath, await fs.readFile(configJsPath, 'utf8'));
  }

  if (configTsPath) {
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

    if (outputText) {
      return requireConfig(configTsPath, outputText);
    }
  }

  return null;
});

/**
 * Temporarily, we need to mock the community CLI, because
 * some packages are checking the version of the CLI in the `react-native.config.js` file.
 * We can remove this once we remove this check from packages.
 */
function requireConfig(filepath: string, configContents: string) {
  try {
    const config = requireFromString(configContents, filepath, {
      prependPaths: [mockedNativeModules],
    });
    return config.default ?? config ?? null;
  } catch {
    return null;
  }
}
