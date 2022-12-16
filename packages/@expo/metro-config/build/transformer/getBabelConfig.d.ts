/**
 * Copyright (c) Expo.
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * Forks the default metro-react-native-babel-transformer and adds support for known transforms.
 */
import type { PluginItem as BabelPlugins } from '@babel/core';
import type { BabelTransformerOptions } from 'metro-babel-transformer';
/**
 * Given a filename and options, build a Babel
 * config object with the appropriate plugins.
 */
export declare function getBabelConfig(filename: string, options: BabelTransformerOptions, plugins?: BabelPlugins): any;
