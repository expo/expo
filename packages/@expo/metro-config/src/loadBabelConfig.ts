/**
 * Copyright (c) 650 Industries (Expo). All rights reserved.
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import fs from 'node:fs';
import path from 'node:path';

import type { TransformOptions } from './babel-core';

/**
 * Returns a memoized function that checks for the existence of a
 * project-level .babelrc file. If it doesn't exist, it reads the
 * default React Native babelrc file and uses that.
 */
export const loadBabelConfig = (function () {
  let babelRC: Pick<TransformOptions, 'extends' | 'presets'> | null = null;

  return function _getBabelRC({ projectRoot }: { projectRoot: string }) {
    if (babelRC !== null) {
      return babelRC;
    }

    babelRC = {};

    if (projectRoot) {
      // Check for various babel config files in the project root
      // TODO(EvanBacon): We might want to disable babelrc lookup when the user specifies `enableBabelRCLookup: false`.
      const possibleBabelRCPaths = ['.babelrc', '.babelrc.js', 'babel.config.js'];

      const foundBabelRCPath = possibleBabelRCPaths.find((configFileName) =>
        fs.existsSync(path.resolve(projectRoot, configFileName))
      );

      // Extend the config if a babel config file is found
      if (foundBabelRCPath) {
        babelRC.extends = path.resolve(projectRoot, foundBabelRCPath);
      }
    }

    // Use the default preset for react-native if no babel config file is found
    if (!babelRC.extends) {
      babelRC.presets = [require('babel-preset-expo')];
    }

    return babelRC;
  };
})();
