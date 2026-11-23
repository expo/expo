import spawnAsync from '@expo/spawn-async';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';

import { createExpoServe, executeExpoAsync } from '../../utils/expo';
import { processFindPrefixedValue } from '../../utils/process';
import { setupServer } from '../../utils/runtime';
import { createBackgroundServer } from '../../utils/server';
import { findProjectFiles, getRouterE2ERoot, getTemporaryPath } from '../utils';
import { runExportSideEffects } from './export-side-effects';

runExportSideEffects();

jest.unmock('@expo/spawn-async');

it.each([
  ['pair', 'commonjs'],
  ['string', 'commonjs'],
  ['captured', 'commonjs'],
  ['pair', 'module'],
  ['string', 'module'],
  ['captured', 'module'],
])(
  'exports a custom serializer %s result as server artifacts (%s)',
  async (format, packageType) => {
    const extension = packageType === 'module' ? '.cjs' : '.js';
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
      const packagePath = path.join(projectRoot, 'package.json');
      const pkg = JSON.parse(await fs.promises.readFile(packagePath, 'utf8'));
      await fs.promises.writeFile(packagePath, JSON.stringify({ ...pkg, type: packageType }));
      await fs.promises.appendFile(
        path.join(projectRoot, 'metro.config.cjs'),
        `
const serialize = config.serializer.customSerializer;
const baseJSBundle = require(${JSON.stringify(require.resolve('@expo/metro/metro/DeltaBundler/Serializers/baseJSBundle'))}).default;
const bundleToString = require(${JSON.stringify(require.resolve('@expo/metro/metro/lib/bundleToString'))}).default;
config.serializer.customSerializer = (...args) => require('node:path').basename(args[0]) === 'hello+api.ts'
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
      const filename = findProjectFiles(serverRoot).find((file) =>
        file.endsWith('hello+api' + extension)
      )!;
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

it.each(['commonjs', 'module'])(
  'exports and runs a server route with a standalone worker (%s)',
  async (packageType) => {
    const extension = packageType === 'module' ? '.cjs' : '.js';
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
      const packagePath = path.join(projectRoot, 'package.json');
      const pkg = JSON.parse(await fs.promises.readFile(packagePath, 'utf8'));
      await fs.promises.writeFile(packagePath, JSON.stringify({ ...pkg, type: packageType }));
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
          path.join(serverRoot, `_expo/functions/hello+api${extension}`),
        ],
        { cwd: projectRoot }
      ).catch((error) => {
        throw new Error(error.stderr || error.message);
      });
      const result = JSON.parse(stdout);
      expect(result.value).toBe('worker result');
      expect(path.basename(result.workerPath)).toMatch(/^worker-/);
      expect(result.workerPath.endsWith(extension)).toBe(true);
      const workerFilename = path.join(serverRoot, result.workerPath);
      expect(fs.existsSync(workerFilename)).toBe(true);
      expect(fs.existsSync(workerFilename + '.map')).toBe(true);
    } finally {
      await fs.promises.rm(projectRoot, { recursive: true, force: true });
    }
  }
);

describe.each([
  ['SSR', 'commonjs', 'default', true],
  ['RSC', 'commonjs', 'default', true],
  ['SSR', 'module', 'default', true],
  ['RSC', 'module', 'default', true],
  ['RSC', 'commonjs', 'custom action', true],
  ['RSC', 'module', 'custom action', true],
  ['SSR', 'module', 'default', false],
  ['RSC', 'module', 'default', false],
  ['RSC', 'module', 'custom action', false],
] as const)('server artifacts: %s (%s, %s, maps: %s)', (mode, packageType, variant, sourceMaps) => {
  const extension = packageType === 'module' ? '.cjs' : '.js';
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
    const packagePath = path.join(projectRoot, 'package.json');
    const pkg = JSON.parse(await fs.promises.readFile(packagePath, 'utf8'));
    await fs.promises.writeFile(packagePath, JSON.stringify({ ...pkg, type: packageType }));
    if (variant === 'custom action') {
      await fs.promises.appendFile(
        path.join(projectRoot, 'metro.config.cjs'),
        `
const original = config.serializer.customSerializer;
config.serializer.customSerializer = async (...args) => {
  const result = await original(...args);
  return args[0].endsWith('/actions.ts')
    ? result.artifacts.find((artifact) => artifact.type === 'js').source
    : result;
};
`
      );
    }
    await executeExpoAsync(
      projectRoot,
      ['export', '-p', 'web', ...(sourceMaps ? ['--source-maps'] : [])],
      {
        env: { NODE_ENV: 'production', TEST_RSC: mode === 'RSC' ? '1' : '0' },
      }
    );
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

  if (mode === 'SSR') {
    const serve = setupServer({
      name: 'expo serve',
      prepareDist: async () => [outputDir],
      createServer: () => createExpoServe({ cwd: projectRoot, env: { NODE_ENV: 'production' } }),
    });

    it('serves API, middleware, loaders, and JavaScript client scripts with expo serve', async () => {
      const api = await serve.fetchAsync('/hello');
      expect(api.status).toBe(200);
      expect(api.headers.get('x-esm-middleware')).toBe('true');
      await expect(api.json()).resolves.toEqual({ message: 'Hello from server artifacts' });
      const response = await serve.fetchAsync('/');
      expect(response.status).toBe(200);
      const html = await response.text();
      expect(html).toContain('Hello from server artifacts');
      const scripts = [...html.matchAll(/<script[^>]*src="([^"]+)"/g)].map((match) => match[1]!);
      expect(scripts.length).toBeGreaterThan(0);
      for (const script of scripts) {
        expect(script.endsWith('.js')).toBe(true);
        expect((await serve.fetchAsync(script)).status).toBe(200);
      }
      const loader = await serve.fetchAsync('/_expo/loaders/index');
      expect(loader.status).toBe(200);
      await expect(loader.json()).resolves.toEqual({ message: 'Hello from server artifacts' });
    });
  }

  it('persists server artifacts with required and optional source maps', () => {
    const root = path.join(outputDir, 'server');
    const files = findProjectFiles(root);
    expect(
      files.filter((file) => packageType === 'module' && /\.js(?:\.map)?$/.test(file))
    ).toEqual([]);
    const bundles = files.filter(
      (file) => file.endsWith(extension) && !file.endsWith('-manifest' + extension)
    );
    expect(bundles.length).toBeGreaterThan(0);
    const manifest = JSON.parse(fs.readFileSync(path.join(root, '_expo/routes.json'), 'utf8'));
    for (const route of [...manifest.apiRoutes, manifest.middleware, manifest.rendering]) {
      if (route?.file) expect(files).toContain(route.file);
    }
    for (const route of manifest.htmlRoutes) {
      if (route.loader) expect(files).toContain(route.loader);
    }
    const clientFiles = findProjectFiles(path.join(outputDir, 'client'));
    expect(clientFiles.some((file) => file.endsWith('.js'))).toBe(true);
    expect(clientFiles.some((file) => file.endsWith('.cjs'))).toBe(false);
    if (mode === 'RSC') {
      expect(files.includes(`_expo/rsc/web/router${extension}.map`)).toBe(sourceMaps);
      for (const name of ['ssr', 'action']) {
        expect(files).toContain(`_expo/rsc/web/${name}-manifest${extension}`);
      }
      const actions = createRequire(__filename)(
        path.join(root, `_expo/rsc/web/action-manifest${extension}`)
      );
      expect(Object.values(actions).length).toBeGreaterThan(0);
      for (const [, filename] of Object.values(actions) as [string, string][]) {
        expect(files).toContain(filename);
        expect(filename.endsWith(extension)).toBe(true);
      }
      expect(
        files.some(
          (file) => file.startsWith('_expo/rsc/web/actions-') && file.endsWith(extension + '.map')
        )
      ).toBe(sourceMaps);
    }
    if (!sourceMaps) {
      expect(clientFiles.some((file) => file.endsWith('.map'))).toBe(false);
      expect(files.some((file) => file.startsWith('_expo/rsc/') && file.endsWith('.map'))).toBe(
        false
      );
    }
    for (const filename of bundles) {
      const code = fs.readFileSync(path.join(root, filename), 'utf8');
      if (!sourceMaps && filename.startsWith('_expo/rsc/')) {
        expect(code).not.toContain('//# sourceMappingURL=');
        continue;
      }
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
    if (mode === 'SSR') expect(response.headers.get('x-esm-middleware')).toBe('true');
    expect(await response.text()).toContain(
      mode === 'RSC' ? 'Server artifact RSC page' : 'Hello from server artifacts'
    );
  });

  it('executes API routes, loaders, and actions with source-mapped errors when requested', async () => {
    if (mode === 'SSR') {
      const api = await server.fetchAsync('/hello');
      expect(api.status).toBe(200);
      expect(api.headers.get('x-esm-middleware')).toBe('true');
      await expect(api.json()).resolves.toEqual({ message: 'Hello from server artifacts' });
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
      if (sourceMaps) expect(payload).toMatch(/\(\/actions\.ts:4:\d+\)/);
    }
  });
});
