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
import { generateAssetCodeFileAst } from 'metro/src/Bundler/util';
import { BabelTransformerArgs } from 'metro-babel-transformer';
import path from 'node:path';
import url from 'node:url';

import { getUniversalAssetData } from './getAssets';

// import type {AssetDataFiltered, AssetDataWithoutFiles} from '../Assets';
// import type {File} from '@babel/types';

// import babylon from '@babel/parser';

export async function transform(
  { filename, options }: BabelTransformerArgs,
  assetRegistryPath: string,
  assetDataPlugins: readonly string[]
) {
  options ??= options || {
    platform: '',
    projectRoot: '',
    inlineRequires: false,
    minify: false,
  };

  const absolutePath = path.resolve(options.projectRoot, filename);

  if (options.customTransformOptions?.environment === 'react-server') {
    // Register client components for assets in server component environments.
    const buildRequire = template.statement(
      `module.exports = require('react-server-dom-webpack/server').createClientModuleProxy(FILE_PATH);`
    );
    const clientReference = url.pathToFileURL(absolutePath).href;
    return {
      ast: t.file(
        t.program([
          buildRequire({
            FILE_PATH: JSON.stringify(clientReference),
          }),
        ])
      ),
      reactClientReference: clientReference,
    };
  }

  const data = await getUniversalAssetData(
    absolutePath,
    filename,
    assetDataPlugins,
    options.platform,
    options.publicPath
  );

  return {
    ast: generateAssetCodeFileAst(assetRegistryPath, data),
  };
}

// const assetPropertyBlockList = new Set(['files', 'fileSystemLocation', 'path']);

// function generateAssetCodeFileAst(
//   assetRegistryPath: string,
//   assetDescriptor: AssetDataWithoutFiles,
// ): File {
//   const properDescriptor = filterObject(
//     assetDescriptor,
//     assetPropertyBlockList,
//   );

//   // {...}
//   const descriptorAst = babylon.parseExpression(
//     JSON.stringify(properDescriptor),
//   );
//   const t = babelTypes;

//   // require('AssetRegistry').registerAsset({...})
//   const buildRequire = template.statement(`
//     'use client'
//     module.exports = require(ASSET_REGISTRY_PATH).registerAsset(DESCRIPTOR_AST)
//   `);

//   return t.file(
//     t.program([
//       buildRequire({
//         ASSET_REGISTRY_PATH: t.stringLiteral(assetRegistryPath),
//         DESCRIPTOR_AST: descriptorAst,
//       }),
//     ]),
//   );
// }

// function filterObject(
//   object: AssetDataWithoutFiles,
//   blockList: Set<string>,
// ): AssetDataFiltered {
//   const copied = {...object};
//   for (const key of blockList) {
//     // $FlowFixMe[prop-missing]
//     delete copied[key];
//   }
//   return copied;
// }
