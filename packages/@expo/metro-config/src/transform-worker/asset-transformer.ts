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
import { template, types as t } from '@babel/core';
import type { JsTransformOptions } from '@expo/metro/metro-transform-worker';
import path from 'node:path';
import url from 'node:url';

import { toPosixPath } from '../utils/filePath';
import { getUniversalAssetData } from './getAssets';
import type { ExpoCustomTransformOptions } from './types';

export async function transformToSource(
  {
    filename,
    options,
  }: {
    filename: string;
    options: Pick<JsTransformOptions, 'platform' | 'customTransformOptions'> & {
      projectRoot: string;
      publicPath: string;
    };
  },
  assetRegistryPath: string,
  assetDataPlugins: readonly string[]
): Promise<{
  code: string;
  reactClientReference?: string;
}> {
  options ??= options || {
    platform: '',
    projectRoot: '',
  };

  const customTransformOptions = options.customTransformOptions as
    | ExpoCustomTransformOptions
    | undefined;

  // Is bundling for webview.
  const isDomComponent = options.platform === 'web' && customTransformOptions?.dom;
  const useMd5Filename = customTransformOptions?.useMd5Filename;
  const isExport = options.publicPath.includes('?export_path=');
  const isHosted = options.platform === 'web' || (customTransformOptions?.hosted && isExport);
  const isReactServer = customTransformOptions?.environment === 'react-server';
  const isServerEnv = isReactServer || customTransformOptions?.environment === 'node';

  const absolutePath = path.resolve(options.projectRoot, filename);

  const getClientReference = () =>
    isReactServer ? url.pathToFileURL(absolutePath).href : undefined;

  if (
    (options.platform !== 'web' ||
      // React Server DOM components should use the client reference in order to locate embedded assets.
      isDomComponent) &&
    // NOTE(EvanBacon): There may be value in simply evaluating assets on the server.
    // Here, we're passing the info back to the client so the multi-resolution asset can be evaluated and downloaded.
    isReactServer
  ) {
    return {
      code: `module.exports = require('react-server-dom-webpack/server').createClientModuleProxy(${JSON.stringify(
        `./${toPosixPath(path.relative(options.projectRoot, absolutePath))}`
      )});`,
      reactClientReference: getClientReference()!,
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
      : options.publicPath,
    isHosted
  );

  if (isServerEnv || options.platform === 'web') {
    const type = !data.type ? '' : `.${data.type}`;
    let assetPath: string;
    if (useMd5Filename) {
      assetPath = data.hash + type;
    } else if (!isExport) {
      assetPath = data.httpServerLocation + '/' + data.name + type;
    } else {
      assetPath = data.httpServerLocation.replace(/\.\.\//g, '_') + '/' + data.name + type;
    }

    // If size data is known then it should be passed back to ensure the correct dimensions are used.
    if (data.width != null || data.height != null) {
      // React Server Component image sources cannot contain functions.
      return {
        code: `module.exports = { uri: ${JSON.stringify(assetPath)}, width: ${
          data.width != null ? String(data.width) : 'undefined'
        }, height: ${data.height != null ? String(data.height) : 'undefined'}${
          isReactServer ? '' : ', toString() { return this.uri; }'
        } };`,
        reactClientReference: getClientReference(),
      };
    }

    // Use single string references outside of client-side React Native.
    // module.exports = "/foo/bar.png";
    return {
      code: `module.exports = ${JSON.stringify(assetPath)};`,
      reactClientReference: getClientReference(),
    };
  }

  const descriptor = { ...data };
  for (const key of ['files', 'fileSystemLocation', 'path']) {
    delete (descriptor as Record<string, unknown>)[key];
  }
  return {
    code: `module.exports = require(${JSON.stringify(assetRegistryPath)}).registerAsset(${JSON.stringify(descriptor)});`,
  };
}

export async function transform(...args: Parameters<typeof transformToSource>): Promise<{
  ast: t.File;
  reactClientReference?: string;
}> {
  const { code, reactClientReference } = await transformToSource(...args);
  return {
    ast: t.file(template.program.ast(code)),
    reactClientReference,
  };
}
