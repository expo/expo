import { evalModule } from '@expo/require-utils';
import fs from 'fs/promises';
import path from 'path';

import { memoize, fileExistsAsync } from '../utils';
import type { RNConfigReactNativeConfig } from './reactNativeConfig.types';

const mockedNativeModules = path.join(__dirname, '..', '..', 'node_modules_mock');

/**
 * Load the `react-native.config.js` or `react-native.config.ts` from the package.
 */
export const loadConfigAsync = memoize(async function loadConfigAsync<
  T extends RNConfigReactNativeConfig,
>(packageRoot: string): Promise<T | null> {
  const configPath = (await Promise.all(
    ['react-native.config.js', 'react-native.config.ts'].map(async (fileName) => {
      const file = path.join(packageRoot, fileName);
      return (await fileExistsAsync(file)) ? file : null;
    })
  )).find((path) => path != null);
  if (configPath) {
    return evalModule(
      await fs.readFile(configPath, 'utf8'),
      configPath,
      // NOTE: We need to mock the Community CLI temporarily, because
      // some packages are checking the version of the CLI in the `react-native.config.js` file.
      // We can remove this once we remove this check from packages.
      { paths: [mockedNativeModules] }
    );
  } else {
    return null;
  }
});
