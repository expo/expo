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
import { type ParseResult, template, types as t } from '@babel/core';
import type { BabelTransformerArgs } from '@expo/metro/metro-babel-transformer';
import { generateAssetCodeFileAst } from '@expo/metro/metro/Bundler/util';
import path from 'node:path';
import url from 'node:url';

import { toPosixPath } from '../utils/filePath';
import { getUniversalAssetData } from './getAssets';

// Register client components for assets in server component environments.
const buildClientReferenceRequire = template.statement(
  `module.exports = require('react-server-dom-webpack/server').createClientModuleProxy(FILE_PATH);`
);

const buildStringRef = template.statement(`module.exports = FILE_PATH;`);

// The React Server Component version cannot have a function otherwise we'd be passing a function to the client component <Image />.
// TODO: Make react-native Image and expo-image server components that can simplify the asset before passing to the client component.
const buildStaticObjectRef = template.statement(
  // Matches the `ImageSource` type from React Native: https://reactnative.dev/docs/image#source
  `module.exports = { uri: FILE_PATH, width: WIDTH, height: HEIGHT };`
);

// `sources` carries the structured scale candidates and `srcset` the ready-made attribute value
// derived from them, so consumers can use either without re-parsing (the Astro/responsive-loader
// shape).
const buildStaticObjectRefWithSrcSet = template.statement(
  `module.exports = { uri: FILE_PATH, width: WIDTH, height: HEIGHT, sources: SOURCES, srcset: SRC_SET };`
);

const buildStaticObjectClientRef = template.statement(
  // Matches the `ImageSource` type from React Native: https://reactnative.dev/docs/image#source
  `module.exports = { uri: FILE_PATH, width: WIDTH, height: HEIGHT, toString() { return this.uri } };`
);

const buildStaticObjectClientRefWithSrcSet = template.statement(
  `module.exports = { uri: FILE_PATH, width: WIDTH, height: HEIGHT, sources: SOURCES, srcset: SRC_SET, toString() { return this.uri } };`
);

type ScaledAssetCandidate = { uri: string; scale: number };

/**
 * Resolves the URL of every scale of a multi-resolution asset.
 *
 * Unlike native, web collapses a multi-resolution asset to a single `uri`, which is always the
 * 1x file. Every scale is written next to it during export and served from the same location in
 * development, so each candidate is the 1x path with an `@<scale>x` suffix before the extension.
 *
 * Returns `null` when there is nothing to choose between.
 */
function getScaledAssetCandidates(
  assetPathWithoutType: string,
  type: string,
  scales: readonly number[] | undefined
): ScaledAssetCandidate[] | null {
  // An asset can ship the same scale twice (`icon.png` next to `icon@1x.png`). Both scales
  // resolve to the same output file, and a repeated density descriptor is invalid in `srcset`.
  const uniqueScales = scales ? Array.from(new Set(scales)) : [];
  if (uniqueScales.length < 2) {
    return null;
  }
  return uniqueScales.map((scale) => {
    const suffix = scale === 1 ? '' : `@${scale}x`;
    return { uri: `${assetPathWithoutType}${suffix}${type}`, scale };
  });
}

/**
 * Builds a density descriptor `srcset` (`icon.png 1x, icon@2x.png 2x, …`) from the scale
 * candidates so the browser can pick the file matching the device pixel ratio.
 */
function getDensitySrcSet(candidates: ScaledAssetCandidate[]): string {
  return candidates
    .map(({ uri, scale }) => {
      // Whitespace and commas separate `srcset` candidates, so a URL containing either would
      // produce an unparsable list. In development the directory portion is already
      // percent-encoded (as the `unstable_path` query value) and only the file name is raw; on
      // export the whole path is raw. Escaping just these two characters is safe in both cases,
      // because percent-encoded output cannot contain them.
      const candidate = uri.replace(/,/g, '%2C').replace(/\s/g, '%20');
      return `${candidate} ${scale}x`;
    })
    .join(', ');
}

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
  ast: ParseResult;
  reactClientReference?: string;
}> {
  options ??= options || {
    platform: '',
    projectRoot: '',
  };

  // Is bundling for webview.
  const isDomComponent = options.platform === 'web' && options.customTransformOptions?.dom;
  const useMd5Filename = options.customTransformOptions?.useMd5Filename;
  const isExport = options.publicPath.includes('?export_path=');
  const isHosted =
    options.platform === 'web' || (options.customTransformOptions?.hosted && isExport);
  const isReactServer = options.customTransformOptions?.environment === 'react-server';
  const isServerEnv = isReactServer || options.customTransformOptions?.environment === 'node';

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
      ast: {
        comments: null,
        ...t.file(
          t.program([
            buildClientReferenceRequire({
              FILE_PATH: JSON.stringify(
                `./${toPosixPath(path.relative(options.projectRoot, absolutePath))}`
              ),
            }),
          ])
        ),
        errors: [],
      },
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
    let assetPathWithoutType: string;
    if (useMd5Filename) {
      assetPathWithoutType = data.hash;
    } else if (!isExport) {
      assetPathWithoutType = data.httpServerLocation + '/' + data.name;
    } else {
      assetPathWithoutType = data.httpServerLocation.replace(/\.\.\//g, '_') + '/' + data.name;
    }
    const assetPath = assetPathWithoutType + type;

    // Scale selection is a browser concept, so it is only useful on web. `useMd5Filename` (DOM
    // components) names every scale of an asset after the same content hash, so the scales are
    // indistinguishable by URL and there is nothing for the browser to choose between.
    const scaleCandidates =
      options.platform !== 'web' || useMd5Filename
        ? null
        : getScaledAssetCandidates(assetPathWithoutType, type, data.scales);

    // If size data is known then it should be passed back to ensure the correct dimensions are used.
    if (data.width != null || data.height != null) {
      const options: Parameters<typeof buildStaticObjectRef>[0] = {
        FILE_PATH: JSON.stringify(assetPath),
        WIDTH: data.width != null ? t.numericLiteral(data.width) : t.buildUndefinedNode(),
        HEIGHT: data.height != null ? t.numericLiteral(data.height) : t.buildUndefinedNode(),
      };
      let creatorFunction: typeof buildStaticObjectRef;
      if (scaleCandidates != null) {
        options.SOURCES = t.arrayExpression(
          scaleCandidates.map(({ uri, scale }) =>
            t.objectExpression([
              t.objectProperty(t.identifier('uri'), t.stringLiteral(uri)),
              t.objectProperty(t.identifier('scale'), t.numericLiteral(scale)),
            ])
          )
        );
        options.SRC_SET = t.stringLiteral(getDensitySrcSet(scaleCandidates));
        creatorFunction = isReactServer
          ? buildStaticObjectRefWithSrcSet
          : buildStaticObjectClientRefWithSrcSet;
      } else {
        creatorFunction = isReactServer ? buildStaticObjectRef : buildStaticObjectClientRef;
      }

      return {
        ast: {
          comments: null,
          ...t.file(t.program([creatorFunction(options)])),
          errors: [],
        },
        reactClientReference: getClientReference(),
      };
    }

    // Use single string references outside of client-side React Native.
    // module.exports = "/foo/bar.png";
    return {
      ast: {
        comments: null,
        ...t.file(t.program([buildStringRef({ FILE_PATH: JSON.stringify(assetPath) })])),
        errors: [],
      },
      reactClientReference: getClientReference(),
    };
  }

  return {
    ast: {
      comments: null,
      ...generateAssetCodeFileAst(assetRegistryPath, data),
      errors: [],
    },
  };
}
