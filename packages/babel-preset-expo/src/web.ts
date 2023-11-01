/**
 * Copyright © 2023-present 650 Industries, Inc. (aka Expo)
 * Copyright © Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { ConfigAPI, PluginItem, TransformOptions } from '@babel/core';

import { BabelPresetExpoOptions, BabelPresetExpoPlatformOptions, getBundler } from './common';
import { expoInlineManifestPlugin } from './expo-inline-manifest-plugin';

export function babelPresetExpoWeb(
  api: ConfigAPI,
  options: BabelPresetExpoOptions = {}
): TransformOptions {
  const bundler = api.caller(getBundler);
  const isWebpack = bundler === 'webpack';

  const platformOptions: BabelPresetExpoPlatformOptions = {
    // Only disable import/export transform when Webpack is used because
    // Metro does not support tree-shaking.
    disableImportExportTransform: isWebpack,
    ...options.web,
  };

  const metroOptions = options.web;

  const extraPlugins: PluginItem[] = [
    require('babel-plugin-react-native-web'),
    require('@babel/plugin-syntax-export-default-from'),
  ];

  // Webpack uses the DefinePlugin to provide the manifest to `expo-constants`.
  if (bundler !== 'webpack') {
    extraPlugins.push(expoInlineManifestPlugin);
  }

  if (metroOptions?.enableBabelRuntime !== false) {
    // Allows configuring a specific runtime version to optimize output
    const isVersion = typeof metroOptions?.enableBabelRuntime === 'string';
    extraPlugins.push([
      require('@babel/plugin-transform-runtime'),
      {
        corejs: false,
        helpers: true,
        regenerator: true,
        ...(isVersion && {
          version: metroOptions.enableBabelRuntime,
        }),
      },
    ]);
  }

  return {
    comments: false,
    compact: true,

    presets: [
      [
        require('@babel/preset-env'),
        {
          modules: platformOptions.disableImportExportTransform ? false : 'commonjs',
          exclude: ['transform-typeof-symbol'],
        },
      ],

      // TypeScript support
      [require('@babel/preset-typescript'), { allowNamespaces: true }],
    ],

    // React Native legacy transforms for flow and TypeScript
    overrides: [
      // the flow strip types plugin must go BEFORE class properties!
      // there'll be a test case that fails if you don't.
      {
        test: (filename) =>
          !platformOptions.disableFlowStripTypesTransform &&
          (filename == null || !/\.tsx?$/.test(filename)),
        plugins: [
          require('@babel/plugin-transform-flow-strip-types'),
          require('babel-plugin-transform-flow-enums'),
        ],
      },
      // Additional features
      {
        plugins: extraPlugins,
      },
    ],
  };
}
