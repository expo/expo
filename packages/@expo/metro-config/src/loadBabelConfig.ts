/**
 * Copyright (c) 650 Industries (Expo). All rights reserved.
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import fs from 'node:fs';
import path from 'node:path';

import type { PluginItem } from './babel-core';

interface LoadBabelConfigResult {
  exts?: string;
  presets?: PluginItem[];
}

/**
 * Returns a memoized function that checks for the existence of a
 * project-level .babelrc file. If it doesn't exist, it reads the
 * default React Native babelrc file and uses that.
 */
export const loadBabelConfig = (function () {
  let result: LoadBabelConfigResult | null = null;

  return function _getBabelRC(options: {
    projectRoot: string;
    enableBabelRCLookup?: boolean | undefined;
  }): LoadBabelConfigResult {
    if (result == null) {
      const { projectRoot, enableBabelRCLookup = true } = options;
      result = {};
      if (options.projectRoot && enableBabelRCLookup) {
        // Check for various babel config files in the project root
        const possibleBabelRCPaths = ['.babelrc', '.babelrc.js', 'babel.config.js'];

        const foundBabelRCPath = possibleBabelRCPaths.find((configFileName) =>
          fs.existsSync(path.resolve(projectRoot, configFileName))
        );

        // Extend the config if a babel config file is found
        if (foundBabelRCPath) {
          result.exts = path.resolve(projectRoot, foundBabelRCPath);
        }
      }

      // Use the default preset for react-native if no babel config file is found
      if (!result.exts) {
        try {
          result.presets = [require('expo/internal/babel-preset')];
        } catch {
          // TODO(@kitten): Temporary, since our E2E tests don't use monorepo
          // packages consistently, including the `expo` package
          result.presets = [require('babel-preset-expo')];
        }
      }
    }
    return result;
  };
})();
