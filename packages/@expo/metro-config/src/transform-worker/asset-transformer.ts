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

// Register client components for assets in server component environments.
const buildClientReferenceRequire = template.statement(
  `module.exports = require('react-server-dom-webpack/server').createClientModuleProxy(FILE_PATH);`
);

const buildStringRef = template.statement(`module.exports = FILE_PATH;`);

const buildStaticObjectRef = template.statement(
  // Matches the `ImageSource` type from React Native: https://reactnative.dev/docs/image#source
  `module.exports = { uri: FILE_PATH, width: WIDTH, height: HEIGHT };`
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
  ast: import('@babel/core').ParseResult;
  reactClientReference?: string;
}> {
  options ??= options || {
    platform: '',
    projectRoot: '',
  };

  // Is bundling for webview.
  const isDomComponent = options.platform === 'web' && options.customTransformOptions?.dom;
  const isExport = options.publicPath.includes('?export_path=');
  const isReactServer = options.customTransformOptions?.environment === 'react-server';
  const isServerEnv = isReactServer || options.customTransformOptions?.environment === 'node';

  const absolutePath = path.resolve(options.projectRoot, filename);

  const getClientReference = () =>
    isReactServer ? url.pathToFileURL(absolutePath).href : undefined;

  if (
    options.platform !== 'web' &&
    // NOTE(EvanBacon): There may be value in simply evaluating assets on the server.
    // Here, we're passing the info back to the client so the multi-resolution asset can be evaluated and downloaded.
    isReactServer
  ) {
    const clientReference = getClientReference()!;
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

  if (isServerEnv || options.platform === 'web') {
    const type = !data.type ? '' : `.${data.type}`;
    const assetPath = !isExport
      ? data.httpServerLocation + '/' + data.name + type
      : data.httpServerLocation.replace(/\.\.\//g, '_') + '/' + data.name + type;

    // If size data is known then it should be passed back to ensure the correct dimensions are used.
    if (data.width != null || data.height != null) {
      return {
        ast: {
          ...t.file(
            t.program([
              buildStaticObjectRef({
                FILE_PATH: JSON.stringify(assetPath),
                WIDTH: data.width != null ? t.numericLiteral(data.width) : t.buildUndefinedNode(),
                HEIGHT:
                  data.height != null ? t.numericLiteral(data.height) : t.buildUndefinedNode(),
              }),
            ])
          ),
          errors: [],
        },
        reactClientReference: getClientReference(),
      };
    }

    // Use single string references outside of client-side React Native.
    // module.exports = "/foo/bar.png";
    return {
      ast: {
        ...t.file(t.program([buildStringRef({ FILE_PATH: JSON.stringify(assetPath) })])),
        errors: [],
      },
      reactClientReference: getClientReference(),
    };
  }

  return {
    ast: {
      ...generateAssetCodeFileAst(assetRegistryPath, data),
      errors: [],
    },
  };
}
