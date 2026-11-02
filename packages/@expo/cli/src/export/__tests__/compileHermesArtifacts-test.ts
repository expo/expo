import { buildHermesBundleAsync } from '@expo/metro-config/build/serializer/exportHermes';
import { transformJsAssetToHermesBytecodeAsync } from '@expo/metro-config/build/serializer/hermesArtifacts';
import type { SerialAsset } from '@expo/metro-config/build/serializer/serializerAssets';

import { compileHermesArtifactsAsync } from '../compileHermesArtifacts';
import { getFilesFromSerialAssets } from '../saveAssets';

jest.mock('@expo/metro-config/build/serializer/exportHermes', () => ({
  buildHermesBundleAsync: jest.fn(async ({ code, map }) => ({
    hbc: Buffer.from(code),
    sourcemap: map,
  })),
}));

it('compiles renamed artifacts once before creating output entries', async () => {
  const asset: SerialAsset = {
    type: 'js',
    filename: 'index.js',
    originFilename: 'index.js',
    source: 'renamed.html\n//# sourceMappingURL=index.js.map',
    metadata: {
      expoDomComponentReferences: ['file:///app/DomView.js'],
    },
  };
  const map: SerialAsset = {
    type: 'map',
    filename: 'index.js.map',
    originFilename: 'index.js',
    metadata: {},
    source: JSON.stringify({ version: 3, sources: [], names: [], mappings: '' }),
  };
  const worker: SerialAsset = {
    type: 'js',
    filename: 'worker.js',
    originFilename: 'worker.js',
    source: 'worker code',
    metadata: { expoDomComponentReferences: ['file:///app/WorkerDomView.js'] },
  };
  const compiled: SerialAsset = {
    ...worker,
    filename: 'compiled.hbc',
    originFilename: 'compiled.js',
    source: Buffer.from('compiled bytecode') as any,
    metadata: {},
  };
  const inputMap = map.source;

  await compileHermesArtifactsAsync('/app', [asset, map, worker, compiled]);
  await transformJsAssetToHermesBytecodeAsync('/app', asset, map);

  expect(buildHermesBundleAsync).toHaveBeenCalledTimes(2);
  expect(buildHermesBundleAsync).toHaveBeenCalledWith({
    projectRoot: '/app',
    filename: '/app/index.js',
    code: 'renamed.html\n//# sourceMappingURL=index.hbc.map',
    map: inputMap,
    minify: true,
  });
  expect(buildHermesBundleAsync).toHaveBeenCalledWith({
    projectRoot: '/app',
    filename: '/app/worker.js',
    code: 'worker code',
    map: null,
    minify: true,
  });
  const files = getFilesFromSerialAssets([asset, map, worker, compiled], {
    includeSourceMaps: true,
    isServerHosted: true,
  });
  expect([...files.keys()]).toEqual(['index.hbc', 'index.hbc.map', 'worker.hbc', 'compiled.hbc']);
  expect(files.get('index.hbc')).toMatchObject({ contents: asset.source, targetDomain: 'client' });
  expect(files.get('index.hbc.map')).toMatchObject({
    contents: map.source,
    targetDomain: 'client',
  });
  expect(files.get(compiled.filename)?.contents).toBe(compiled.source);
});
