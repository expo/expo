import assert from 'assert';
import path from 'path';

import { stringToUUID } from './debugId';
import type { SerialAsset } from './serializerAssets';
import { appendDebugIdToSourceMap } from './sourceMap';

// Lazy-loaded to avoid pulling in metro-source-map at startup
let _buildHermesBundleAsync: typeof import('./exportHermes').buildHermesBundleAsync;
function getBuildHermesBundleAsync() {
  if (!_buildHermesBundleAsync) {
    _buildHermesBundleAsync = require('./exportHermes').buildHermesBundleAsync;
  }
  return _buildHermesBundleAsync;
}

// Compile requested native bytecode after export has resolved DOM filenames.
export async function transformJsAssetToHermesBytecodeAsync(
  projectRoot: string,
  jsAsset: SerialAsset,
  mapAsset?: SerialAsset
): Promise<void> {
  if (Buffer.isBuffer(jsAsset.source)) return;

  const debugId = stringToUUID(path.basename(jsAsset.filename, path.extname(jsAsset.filename)));
  const adjustedSource = jsAsset.source.replace(/^\/\/# (sourceMappingURL)=(.*)$/gm, (...props) => {
    if (props[1] === 'sourceMappingURL') {
      const mapName = props[2].replace(/\.js\.map$/, '.hbc.map');
      return `//# ${props[1]}=` + mapName;
    }
    return '';
  });

  const hermesBundleOutput = await getBuildHermesBundleAsync()({
    projectRoot,
    filename: path.resolve(projectRoot, jsAsset.originFilename),
    code: adjustedSource,
    map: mapAsset ? mapAsset.source : null,
    // TODO: Maybe allow prod + no minify.
    minify: true,
  });

  if (hermesBundleOutput.hbc) {
    // TODO: Unclear if we should add multiple assets, link the assets, or mutate the first asset.
    // @ts-expect-error: TODO
    jsAsset.source = hermesBundleOutput.hbc;
    jsAsset.filename = jsAsset.filename.replace(/\.js$/, '.hbc');

    if (jsAsset.metadata.paths) {
      const rewrittenPaths = { ...jsAsset.metadata.paths };
      for (const [moduleId, modulePaths] of Object.entries(rewrittenPaths)) {
        const rewrittenModulePaths = { ...modulePaths };
        for (const [dependencyId, targetPath] of Object.entries(modulePaths)) {
          assert(
            targetPath == null || typeof targetPath === 'string',
            'Hermes async paths must remain scalar.'
          );
          rewrittenModulePaths[dependencyId] = targetPath
            ? targetPath.replace(/\.js$/, '.hbc')
            : targetPath;
        }
        rewrittenPaths[moduleId] = rewrittenModulePaths;
      }
      jsAsset.metadata.paths = rewrittenPaths;
    }
  }
  if (mapAsset && hermesBundleOutput.sourcemap) {
    mapAsset.source = debugId
      ? appendDebugIdToSourceMap(hermesBundleOutput.sourcemap, debugId)
      : hermesBundleOutput.sourcemap;
    mapAsset.filename = mapAsset.filename.replace(/\.js\.map$/, '.hbc.map');
  }
}
