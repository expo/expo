import type { SerialAsset } from '@expo/metro-config/build/serializer/serializerAssets';

import { getServerEntryArtifact, persistServerArtifacts } from '../serverArtifacts';

it('selects the server entry while preserving standalone worker artifacts', () => {
  const worker: SerialAsset = {
    filename: 'worker.js',
    originFilename: 'worker.ts',
    type: 'js',
    source: 'worker',
    metadata: { isAsync: true },
  };
  const entry: SerialAsset = {
    filename: 'entry.js',
    originFilename: 'entry.ts',
    type: 'js',
    source: 'entry',
    metadata: { isAsync: false },
  };
  const artifacts: SerialAsset[] = [
    worker,
    { ...worker, filename: 'worker.js.map', type: 'map' },
    entry,
    { ...entry, filename: 'entry.js.map', type: 'map' },
  ];
  const files = new Map();
  expect(getServerEntryArtifact(artifacts)).toBe(entry);
  expect(persistServerArtifacts(artifacts, files)).toBe('entry.js');
  expect([...files.keys()]).toEqual(artifacts.map((artifact) => artifact.filename));
});
