import crypto from 'crypto';

import { finalizeDomComponentArtifacts, finalizeNativeDomReferences } from '../domArtifacts';
import { serializeSplitAsync } from '../fork/__tests__/serializer-test-utils';
import type { SerialAsset } from '../serializerAssets';

const md5 = (source: string) => crypto.createHash('md5').update(source).digest('hex');
const js = (
  filename: string,
  source: string,
  metadata: SerialAsset['metadata'] = {}
): SerialAsset => ({ filename, originFilename: filename, source, type: 'js', metadata });

it('finalizes DOM dependency paths, map URLs, and content filenames together', () => {
  const child = js(
    'child.js',
    'const example = `\n//# sourceMappingURL=child.js.map\n`;\n//# sourceMappingURL=child.js.map\n//# debugId=child-id'
  );
  const map: SerialAsset = {
    ...child,
    filename: 'child.js.map',
    type: 'map',
    source: JSON.stringify({
      version: 3,
      sources: ['child.ts'],
      mappings: 'AAAA',
      names: [],
      debugId: 'child-id',
    }),
  };
  const entry = js('entry.js', 'load("./child.js");', {
    paths: { entry: { child: './child.js' } },
    requires: ['child.js'],
    entryChunks: { entry: ['child.js'] },
  });
  finalizeDomComponentArtifacts([entry, child, map]);
  expect(child.source).toContain('const example = `\n//# sourceMappingURL=child.js.map\n`;');
  expect(child.source).toContain('//# sourceMappingURL=' + map.filename + '\n//# debugId=child-id');
  expect(entry.source).toBe(`load("./${child.filename}");`);
  expect(entry.metadata.paths).toEqual({ entry: { child: './' + child.filename } });
  expect(entry.metadata.requires).toEqual([child.filename]);
  expect(entry.metadata.entryChunks).toEqual({ entry: [child.filename] });
  for (const asset of [entry, child, map])
    expect(asset.filename).toBe(md5(asset.source) + '.' + asset.type);
});

it('finalizes an async chunk that dynamically imports itself', async () => {
  const artifacts: SerialAsset[] = await serializeSplitAsync(
    {
      'index.js': `export const load = () => import('./child');`,
      'child.js': `export const value = 42; export const again = () => import('./child');`,
    },
    { baseUrl: './' }
  );
  expect(() => finalizeDomComponentArtifacts(artifacts)).not.toThrow();
  for (const artifact of artifacts) {
    expect(artifact.filename).toBe(md5(artifact.source) + '.' + artifact.type);
    for (const paths of Object.values(artifact.metadata.paths ?? {})) {
      expect(Object.values(paths)).not.toContain('./' + artifact.filename);
    }
  }
});

it('rejects cyclic DOM references that cannot use final-content hashes', () => {
  const a = js('a.js', 'load("./b.js");', { paths: { a: { b: ['./b.js'] } } });
  const b = js('b.js', 'load("./a.js");', { paths: { b: { a: './a.js' } } });
  expect(() => finalizeDomComponentArtifacts([a, b])).toThrow(/cyclic.*DOM/i);
});

it('preserves external CSS URLs', () => {
  const css: SerialAsset = {
    filename: 'https://example.com/style.css',
    originFilename: '',
    source: '',
    type: 'css-external',
    metadata: {},
  };
  finalizeDomComponentArtifacts([css]);
  expect(css.filename).toBe('https://example.com/style.css');
});

it('resolves native DOM references without moving mappings or changing map identity', () => {
  const reference = 'file:///app/Dom.tsx';
  const artifact = js('entry.js', `load("${md5(reference)}.html");\n//# debugId=entry-id`);
  const map: SerialAsset = {
    ...artifact,
    type: 'map',
    filename: 'entry.js.map',
    source: '{"debugId":"entry-id","mappings":"AAAA"}',
  };
  const originalMap = map.source;
  const html = md5('<html />') + '.html';
  const originalLength = artifact.source.length;
  finalizeNativeDomReferences([artifact, map], reference, html);
  expect(artifact.source).toBe(`load("${html}");\n//# debugId=entry-id`);
  expect(artifact.source.length).toBe(originalLength);
  expect(map.source).toBe(originalMap);
});

it('rejects premature Hermes compilation before modifying any native artifacts', () => {
  const reference = 'file:///app/Dom.tsx';
  const source = `load("${md5(reference)}.html");`;
  const pending = js('pending.js', source);
  const compiled = {
    ...js('compiled.hbc', '', { expoDomComponentReferences: [reference] }),
    source: Buffer.from(source) as any,
  };
  expect(() =>
    finalizeNativeDomReferences([pending, compiled], reference, md5('html') + '.html')
  ).toThrow(/compiled Hermes bytecode/);
  expect(pending.source).toBe(source);
});
