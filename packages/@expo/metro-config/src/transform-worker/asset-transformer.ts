/**
 * Copyright 2023-present 650 Industries (Expo). All rights reserved.
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * Fork of the upstream transformer, but with modifications made for web production hashing.
 * https://github.com/facebook/metro/blob/412771475c540b6f85d75d9dcd5a39a6e0753582/packages/metro-transform-worker/src/utils/assetTransformer.js#L1
 */
import template from '@babel/template';
import * as t from '@babel/types';
import { generateAssetCodeFileAst } from '@bycedric/metro/metro/src/Bundler/util';
import { BabelTransformerArgs } from '@bycedric/metro/metro-babel-transformer';
import path from 'node:path';
import url from 'node:url';

import { getUniversalAssetData } from './getAssets';

// Register client components for assets in server component environments.
const buildClientReferenceRequire = template.statement(
  `module.exports = require('react-server-dom-webpack/server').createClientModuleProxy(FILE_PATH);`
);

export async function transform(
  {
    filename,
    options,
  }: {
    filename: string;
    options: Pick<
      BabelTransformerArgs['options'],
      'platform' | 'projectRoot' | 'customTransformOptions' | 'publicPath'
    >;
  },
  assetRegistryPath: string,
  assetDataPlugins: readonly string[]
): Promise<{
  ast: t.File | import('@babel/core').ParseResult;
  reactClientReference?: string;
}> {
  options ??= options || {
    platform: '',
    projectRoot: '',
  };

  // Is bundling for webview.
  const isDomComponent = options.platform === 'web' && options.customTransformOptions?.dom;
  const isExport = options.publicPath.includes('?export_path=');

  const absolutePath = path.resolve(options.projectRoot, filename);

  if (options.customTransformOptions?.environment === 'react-server') {
    const clientReference = url.pathToFileURL(absolutePath).href;
    return {
      ast: {
        ...t.file(
          t.program([
            buildClientReferenceRequire({
              FILE_PATH: JSON.stringify(clientReference),
            }),
          ])
        ),
        errors: [],
      },
      reactClientReference: clientReference,
    };
  }

  const data = await getUniversalAssetData(
    absolutePath,
    filename,
    assetDataPlugins,
    options.platform,
    isDomComponent && isExport
      ? // If exporting a dom component, we need to use a public path that doesn't start with `/` to ensure that assets are loaded
        // relative to the `DOM_COMPONENTS_BUNDLE_DIR`.
        `/assets?export_path=assets`
      : options.publicPath
  );

  return {
    ast: generateAssetCodeFileAst(assetRegistryPath, data),
  };
}
