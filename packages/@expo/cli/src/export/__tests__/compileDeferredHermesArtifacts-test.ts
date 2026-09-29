import { buildHermesBundleAsync } from '@expo/metro-config/build/serializer/exportHermes';
import type { SerialAsset } from '@expo/metro-config/build/serializer/serializerAssets';
import crypto from 'crypto';
import path from 'path';

import { compileDeferredHermesArtifactsAsync } from '../compileDeferredHermesArtifacts';
import { transformNativeBundleForMd5Filename } from '../exportDomComponents';
import type { ExportAssetMap } from '../saveAssets';

jest.mock('@expo/metro-config/build/serializer/exportHermes', () => ({
  // Stand-in for hermesc: the "bytecode" is the JS handed to the compiler, so the
  // tests can assert which source was compiled.
  buildHermesBundleAsync: jest.fn(async ({ code, map }: { code: string; map: string | null }) => ({
    hbc: Buffer.from(code),
    sourcemap: map ? JSON.stringify({ ...JSON.parse(map), x_hermes: true }) : null,
  })),
}));

const projectRoot = '/app';
const domComponentReference = 'file:///app/components/DomView.tsx';
const placeholderHash = crypto.createHash('md5').update(domComponentReference).digest('hex');
const html = '<html></html>';
const htmlMd5 = crypto.createHash('md5').update(html).digest('hex');
const htmlOutputName = `www.bundle/${placeholderHash}.html`;
const jsFilename = '_expo/static/js/ios/index-abc123.js';

function createDeferredBundle() {
  const source = `var filePath = "${placeholderHash}.html";\n//# sourceMappingURL=index-abc123.js.map`;
  const map = JSON.stringify({ version: 3, sources: ['index.js'], mappings: '' });
  const artifacts: SerialAsset[] = [
    {
      filename: jsFilename,
      originFilename: 'index.js',
      type: 'js',
      metadata: {
        deferredHermesBytecode: true,
        expoDomComponentReferences: [domComponentReference],
      },
      source,
    },
    {
      filename: `${jsFilename}.map`,
      originFilename: 'index.js',
      type: 'map',
      metadata: {},
      source: map,
    },
  ];
  const files: ExportAssetMap = new Map([
    [jsFilename, { contents: source }],
    [`${jsFilename}.map`, { contents: map }],
    [htmlOutputName, { contents: html }],
  ]);
  return { artifacts, files };
}

describe(compileDeferredHermesArtifactsAsync, () => {
  it('compiles the renamed JS and moves the files entries to .hbc', async () => {
    const { artifacts, files } = createDeferredBundle();

    // `expo export` renames the DOM html inside the `files` entry first...
    transformNativeBundleForMd5Filename({
      domComponentReference,
      nativeBundle: { artifacts, assets: [] },
      files,
      htmlOutputName,
    });
    // ...then compiles the deferred chunk from that renamed JS.
    await compileDeferredHermesArtifactsAsync({ projectRoot, artifacts, files });

    const hbcFilename = '_expo/static/js/ios/index-abc123.hbc';
    expect(artifacts[0]!.filename).toBe(hbcFilename);
    expect(artifacts[0]!.metadata.deferredHermesBytecode).toBeUndefined();
    expect(artifacts[1]!.filename).toBe(`${hbcFilename}.map`);
    expect([...files.keys()].sort()).toEqual([hbcFilename, `${hbcFilename}.map`, htmlOutputName]);

    const hbc = files.get(hbcFilename)!.contents;
    expect(Buffer.isBuffer(hbc)).toBe(true);
    expect(hbc.toString()).toContain(`${htmlMd5}.html`);
    expect(hbc.toString()).not.toContain(`${placeholderHash}.html`);
    expect(hbc.toString()).toContain('//# sourceMappingURL=index-abc123.hbc.map');
    expect(JSON.parse(files.get(`${hbcFilename}.map`)!.contents.toString())).toMatchObject({
      x_hermes: true,
      debugId: expect.any(String),
    });
    expect(buildHermesBundleAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        projectRoot,
        // Same chunk name the serializer reports when it compiles inline.
        filename: path.resolve(projectRoot, 'index.js'),
        minify: true,
      })
    );
  });

  it('compiles from the artifact source when there is no files entry (export:embed)', async () => {
    const { artifacts } = createDeferredBundle();
    const files: ExportAssetMap = new Map();

    await compileDeferredHermesArtifactsAsync({ projectRoot, artifacts, files });

    expect(artifacts[0]!.filename).toBe('_expo/static/js/ios/index-abc123.hbc');
    expect(Buffer.isBuffer(artifacts[0]!.source)).toBe(true);
    expect(artifacts[0]!.source.toString()).toContain(`${placeholderHash}.html`);
    expect(files.size).toBe(0);
  });

  it('ignores artifacts the serializer already compiled', async () => {
    const workerBytecode = Buffer.from([0xc6, 0x1f, 0xbc, 0x03]);
    const artifacts: SerialAsset[] = [
      {
        filename: '_expo/static/js/ios/worker-def456.hbc',
        originFilename: 'worker.js',
        type: 'js',
        metadata: {},
        source: '',
      },
    ];
    const files: ExportAssetMap = new Map([
      ['_expo/static/js/ios/worker-def456.hbc', { contents: Buffer.from(workerBytecode) }],
    ]);

    await compileDeferredHermesArtifactsAsync({ projectRoot, artifacts, files });

    expect(buildHermesBundleAsync).not.toHaveBeenCalled();
    expect(files.get('_expo/static/js/ios/worker-def456.hbc')?.contents).toEqual(workerBytecode);
  });
});
