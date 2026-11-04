import spawnAsync from '@expo/spawn-async';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';

import { executeExpoAsync } from '../../utils/expo';
import { processFindPrefixedValue } from '../../utils/process';
import { setupServer } from '../../utils/runtime';
import { createBackgroundServer } from '../../utils/server';
import { findProjectFiles, getRouterE2ERoot, getTemporaryPath } from '../utils';
import { runExportSideEffects } from './export-side-effects';

runExportSideEffects();

jest.unmock('@expo/spawn-async');

it.each(['pair', 'string', 'captured'])(
  'exports a custom serializer %s result as server artifacts',
  async (format) => {
    let projectRoot = getTemporaryPath();
    try {
      await fs.promises.cp(
        path.join(__dirname, '../../fixtures/with-server-artifacts'),
        projectRoot,
        { recursive: true }
      );
      projectRoot = await fs.promises.realpath(projectRoot);
      await fs.promises.symlink(
        path.join(getRouterE2ERoot(), 'node_modules'),
        path.join(projectRoot, 'node_modules'),
        'junction'
      );
      await fs.promises.appendFile(
        path.join(projectRoot, 'metro.config.cjs'),
        `
const serialize = config.serializer.customSerializer;
const baseJSBundle = require(${JSON.stringify(require.resolve('@expo/metro/metro/DeltaBundler/Serializers/baseJSBundle'))}).default;
const bundleToString = require(${JSON.stringify(require.resolve('@expo/metro/metro/lib/bundleToString'))}).default;
config.serializer.customSerializer = (...args) => args[0].endsWith('/hello+api.ts')
  ? ${JSON.stringify(format)} === 'string' ? bundleToString(baseJSBundle(...args)).code : {
      code: 'module.exports = { GET() { return Response.json({ custom: true }); } };\\n//# sourceMappingURL=old.js.map\\n//# debugId=01234567-89ab-4cde-8fab-0123456789ab',
      map: JSON.stringify({ version: 3, sources: ${JSON.stringify(format)} === 'captured' ? [require('node:path').join(__dirname, 'app/hello+api.ts')] : ['custom://project/original.ts'], sourcesContent: ['original source'], names: [], mappings: 'AAAA', debugId: '01234567-89ab-4cde-8fab-0123456789ab' }),
    }
  : serialize(...args);
if (${JSON.stringify(format)} === 'captured') {
  const { withSerializerPlugins } = require(${JSON.stringify(require.resolve('@expo/metro-config/build/serializer/withExpoSerializers'))});
  module.exports = withSerializerPlugins(config, []);
}
`
      );
      await executeExpoAsync(projectRoot, ['export', '-p', 'web', '--api-only', '--source-maps'], {
        env: { NODE_ENV: 'production' },
      });
      const serverRoot = path.join(projectRoot, 'dist/server');
      const filename = findProjectFiles(serverRoot).find((file) => file.endsWith('hello+api.js'))!;
      expect(filename).toBeDefined();
      const output = path.join(serverRoot, filename);
      const { GET } = createRequire(__filename)(output);
      await expect((await GET(new Request('http://localhost/hello'))).json()).resolves.toEqual(
        format === 'string' ? { message: 'Hello from server artifacts' } : { custom: true }
      );
      const map = JSON.parse(await fs.promises.readFile(output + '.map', 'utf8'));
      if (format !== 'string') {
        expect(map).toMatchObject({
          sources: format === 'captured' ? ['/app/hello+api.ts'] : ['custom://project/original.ts'],
          mappings: 'AAAA',
          debugId: '01234567-89ab-4cde-8fab-0123456789ab',
        });
      } else {
        expect(map.sources).toContain('/app/hello+api.ts');
        expect(map.sources).toContain('/data.ts');
      }
      expect(map.sourcesContent).toBeUndefined();
      const code = await fs.promises.readFile(output, 'utf8');
      expect(code).toContain(
        '//# sourceMappingURL=' +
          encodeURIComponent(path.basename(filename) + '.map') +
          '\n//# debugId=' +
          map.debugId
      );
      expect(code).not.toContain('old.js.map');
    } finally {
      await fs.promises.rm(projectRoot, { recursive: true, force: true });
    }
  }
);

it('exports and runs a server route with a standalone worker', async () => {
  let projectRoot = getTemporaryPath();
  try {
    await fs.promises.cp(
      path.join(__dirname, '../../fixtures/with-server-artifacts'),
      projectRoot,
      { recursive: true }
    );
    projectRoot = await fs.promises.realpath(projectRoot);
    await fs.promises.symlink(
      path.join(getRouterE2ERoot(), 'node_modules'),
      path.join(projectRoot, 'node_modules'),
      'junction'
    );
    await fs.promises.writeFile(
      path.join(projectRoot, 'app/hello+api.ts'),
      `
import { Worker as NodeWorker } from 'node:worker_threads';
import path from 'node:path';
export async function GET() {
  const workerPath = require.unstable_resolveWorker('../worker');
  const worker = new NodeWorker(path.join(__dirname, '../..', workerPath));
  const value = await new Promise((resolve, reject) => {
    worker.once('message', resolve);
    worker.once('error', reject);
  });
  await worker.terminate();
  return Response.json({ value, workerPath });
}
`
    );
    await fs.promises.writeFile(
      path.join(projectRoot, 'worker.ts'),
      `
import { parentPort } from 'node:worker_threads';
parentPort.postMessage('worker result');
`
    );
    await executeExpoAsync(projectRoot, ['export', '-p', 'web', '--api-only', '--source-maps'], {
      env: { NODE_ENV: 'production' },
    });
    const serverRoot = path.join(projectRoot, 'dist/server');
    const { stdout } = await spawnAsync(
      process.execPath,
      [
        '-e',
        'require(process.argv[1]).GET().then(async (response) => console.log(JSON.stringify(await response.json()))).catch((error) => { console.error(error); process.exitCode = 1; });',
        path.join(serverRoot, '_expo/functions/hello+api.js'),
      ],
      { cwd: projectRoot }
    ).catch((error) => {
      throw new Error(error.stderr || error.message);
    });
    const result = JSON.parse(stdout);
    expect(result.value).toBe('worker result');
    expect(result.workerPath).toMatch(/worker-.*\.js$/);
    const workerFilename = path.join(serverRoot, result.workerPath);
    expect(fs.existsSync(workerFilename)).toBe(true);
    expect(fs.existsSync(workerFilename + '.map')).toBe(true);
  } finally {
    await fs.promises.rm(projectRoot, { recursive: true, force: true });
  }
});

describe.each(['SSR', 'RSC'])('serialized server artifacts: %s', (mode) => {
  let projectRoot = getTemporaryPath();
  const outputDir = path.join(projectRoot, 'dist');

  beforeAll(async () => {
    await fs.promises.cp(
      path.join(__dirname, '../../fixtures/with-server-artifacts'),
      projectRoot,
      { recursive: true }
    );
    projectRoot = await fs.promises.realpath(projectRoot);
    await fs.promises.symlink(
      path.join(getRouterE2ERoot(), 'node_modules'),
      path.join(projectRoot, 'node_modules'),
      'junction'
    );
    await executeExpoAsync(projectRoot, ['export', '-p', 'web', '--source-maps'], {
      env: { NODE_ENV: 'production', TEST_RSC: mode === 'RSC' ? '1' : '0' },
    });
  });

  afterAll(async () => {
    await fs.promises.rm(projectRoot, { recursive: true, force: true });
  });

  const server = setupServer({
    name: 'native Node',
    prepareDist: async () => [outputDir],
    createServer: () =>
      createBackgroundServer({
        cwd: projectRoot,
        command: [
          process.execPath,
          '--enable-source-maps',
          path.join(projectRoot, 'server.cjs'),
          require.resolve('expo-server/adapter/http'),
        ],
        host: (chunk) => processFindPrefixedValue(chunk, 'Server running at'),
      }),
  });

  it('persists flat server maps with sibling references, debug IDs, and no embedded sources', () => {
    const root = path.join(outputDir, 'server');
    const files = findProjectFiles(root);
    const bundles = files.filter((file) => file.endsWith('.js') && !file.endsWith('-manifest.js'));
    expect(bundles.length).toBeGreaterThan(0);
    if (mode === 'RSC') {
      expect(files).toContain('_expo/rsc/web/router.js.map');
      expect(files.some((file) => /_expo\/rsc\/web\/actions-.*\.js\.map$/.test(file))).toBe(true);
    }
    for (const filename of bundles) {
      const code = fs.readFileSync(path.join(root, filename), 'utf8');
      const map = JSON.parse(fs.readFileSync(path.join(root, filename + '.map'), 'utf8'));
      expect(code).toContain(
        '//# sourceMappingURL=' + encodeURIComponent(path.basename(filename) + '.map')
      );
      expect(code).toContain('//# debugId=' + map.debugId);
      expect(map.sections).toBeUndefined();
      expect(map.sourcesContent).toBeUndefined();
      expect(map.sources.length).toBeGreaterThan(0);
      expect(JSON.stringify(map)).not.toContain(projectRoot);
    }
  });

  it('loads the exported page through the native adapter', async () => {
    const response = await server.fetchAsync(
      mode === 'RSC' ? '/_flight/web/index.txt?platform=web' : '/'
    );
    expect(response.status).toBe(200);
    expect(await response.text()).toContain(
      mode === 'RSC' ? 'Server artifact RSC page' : 'Hello from server artifacts'
    );
  });

  it('maps deployed stack traces to virtual source names independent of the export directory', async () => {
    if (mode === 'SSR') {
      const response = await server.fetchAsync('/hello?error=1');
      expect(response.status).toBe(200);
      const { stack } = await response.json();
      expect(stack).toMatch(/\(\/app\/hello\+api\.ts:4:\d+\)/);
      const loader = await server.fetchAsync('/_expo/loaders/index');
      expect(loader.status).toBe(200);
      await expect(loader.json()).resolves.toEqual({ message: 'Hello from server artifacts' });
    } else {
      // Initialize the RSC runtime before invoking a modules-only action bundle.
      expect((await server.fetchAsync('/_flight/web/index.txt?platform=web')).status).toBe(200);
      const response = await server.fetchAsync(
        '/_flight/web/ACTION_./actions.ts/mappedAction.txt',
        {
          method: 'POST',
          headers: { 'expo-platform': 'web', 'content-type': 'text/plain' },
          body: '[]',
        }
      );
      expect(response.status).toBe(200);
      const payload = await response.text();
      expect(payload).toContain('mapped action error');
      expect(payload).toMatch(/\(\/actions\.ts:4:\d+\)/);
    }
  });
});
