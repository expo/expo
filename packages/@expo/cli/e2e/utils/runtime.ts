import { getRouterE2ERoot } from "../__tests__/utils";
import path from "node:path";
import { createExpoServe, createExpoStart, executeExpoAsync } from "./expo";
import { executeAsync, processFindPrefixedValue } from "./process";
import fs from "node:fs";
import { BackgroundServer, createBackgroundServer } from "./server";

export const RUNTIME_EXPO_SERVE = 'expo serve';
export const RUNTIME_EXPO_START = 'expo start';
export const RUNTIME_EXPRESS_SERVER = 'express';
export const RUNTIME_WORKERD = 'workerd';

type RuntimeType = typeof RUNTIME_EXPO_SERVE
  | typeof RUNTIME_EXPO_START
  | typeof RUNTIME_EXPRESS_SERVER
  | typeof RUNTIME_WORKERD;

export type ServerTestConfiguration = {
  name: string;
  createServer: () => BackgroundServer;
  prepareDist: () => Promise<[outputDir: string, outputName?: string]>;
};

export type ServerTestOptions = {
  /** The E2E test scenario directory name (e.g., 'server-middleware-async') */
  fixtureName: string;
  /** Options for the export command */
  export?: {
    /** Environment variables to pass to the export command */
    env?: Record<string, string>;
    /** Additional CLI flags to pass to the export command */
    cliFlags?: string[];
  };
  /** Options for the HTTP server */
  serve?: {
    /** Environment variables to pass to the server */
    env?: Record<string, string>;
  };
};

/**
 * Creates server test configurations for the specified runtimes.
 * Use with `describe.each()` to run the same tests against multiple server implementations.
 *
 * @param runtimes - Array of runtime identifiers to prepare (e.g., `['expo serve', 'workerd']`)
 * @param options - Configuration options for the test servers
 *
 * @example
 * ```ts
 * describe.each(
 *   prepareServers(['expo serve', 'workerd'], {
 *     fixtureName: 'server-middleware-async',
 *     export: { env: { E2E_ROUTER_SERVER_MIDDLEWARE: 'true' } },
 *   })
 * )('$name requests', (config) => {
 *   const ctx = setupServer(config);
 *   it('can serve html', async () => {
 *     expect(await ctx.fetchAsync('/').then((r) => r.text())).toMatch(/<div id="root">/);
 *   });
 * });
 * ```
 */
export function prepareServers(runtimes: RuntimeType[], options: ServerTestOptions): ServerTestConfiguration[] {
  const { fixtureName } = options;
  const projectRoot = getRouterE2ERoot();

  const exportEnv = options.export?.env ?? {}
  const exportCliFlags = options.export?.cliFlags ?? [];
  const serveEnv = options.serve?.env ?? {};

  const defaultExportEnv = {
    NODE_ENV: 'production',
    EXPO_USE_STATIC: 'server',
    E2E_ROUTER_SRC: fixtureName,
    ...exportEnv,
  };

  const knownRuntimeConfigs: Record<RuntimeType, Omit<ServerTestConfiguration, 'name'>> = {
    [RUNTIME_EXPO_SERVE]: {
      prepareDist: async () => {
        const outputName = `dist-${fixtureName}-expo-serve`;
        const outputDir = path.join(projectRoot, outputName);

        await executeExpoAsync(
          projectRoot,
          ['export', '-p', 'web', '--output-dir', outputName, ...exportCliFlags],
          { env: defaultExportEnv }
        );

        return [outputDir, outputName];
      },
      createServer: () =>
        createExpoServe({
          cwd: projectRoot,
          env: {
            NODE_ENV: 'production',
            ...serveEnv,
          },
        }),
    },
    [RUNTIME_EXPO_START]: {
      prepareDist: async () => {
        return [''];
      },
      createServer: () =>
        createExpoStart({
          cwd: projectRoot,
          env: {
            ...defaultExportEnv,
            ...serveEnv,
            NODE_ENV: 'development',
          },
        }),
    },
    [RUNTIME_EXPRESS_SERVER]: {
      prepareDist: async () => {
        const outputName = `dist-${fixtureName}-express`;
        const outputDir = path.join(projectRoot, outputName);

        await executeExpoAsync(projectRoot, ['export', '-p', 'web', '--output-dir', outputName, ...exportCliFlags],
          { env: defaultExportEnv }
        );

        return [outputDir, outputName];
      },
      createServer: () =>
        createBackgroundServer({
          command: ['node', path.join(projectRoot, `__e2e__/${fixtureName}/express.js`)],
          host: (chunk: any) => processFindPrefixedValue(chunk, 'Express server listening'),
          cwd: projectRoot,
          env: {
            NODE_ENV: 'production',
            ...serveEnv,
          },
        }),
    },
    [RUNTIME_WORKERD]: {
      prepareDist: async () => {
        const outputName = `dist-${fixtureName}-workerd`;
        const outputDir = path.join(projectRoot, outputName);

        await executeExpoAsync(
          projectRoot,
          ['export', '-p', 'web', '--output-dir', outputName, ...exportCliFlags],
          {env: defaultExportEnv}
        );

        await executeAsync(projectRoot, [
          'node_modules/.bin/esbuild',
          '--bundle',
          '--format=esm',
          '--platform=node',
          `--outfile=${path.join(outputDir, 'server/workerd.js')}`,
          path.join(projectRoot, `__e2e__/${fixtureName}/workerd/workerd.mjs`),
        ]);
        fs.copyFileSync(
          path.join(projectRoot, `__e2e__/${fixtureName}/workerd/config.capnp`),
          path.join(outputDir, 'server/config.capnp')
        );

        return [outputDir];
      },
      createServer: () =>
        createBackgroundServer({
          command: [
            'node_modules/.bin/workerd',
            'serve',
            path.join(projectRoot, `dist-${fixtureName}-workerd`, 'server/config.capnp'),
          ],
          host: (chunk: any) => processFindPrefixedValue(chunk, 'Workerd server listening'),
          port: 8787,
          cwd: projectRoot,
        }),
    }
  };

  const knownRuntimes = Object.keys(knownRuntimeConfigs);

  return runtimes.map((runtime) => {
    if (!knownRuntimes.includes(runtime)) {
      throw new Error(
        `Unknown runtime "${runtime}". Known runtimes: ${knownRuntimes.join(', ')}`
      );
    }

    return {
      ...knownRuntimeConfigs[runtime],
      name: runtime,
    };
  });
}

/**
 * Sets up server lifecycle (`beforeAll()`/`afterAll()`) and returns a test context.
 *
 * @remarks Must be called at the top level of a `describe()` block that uses `prepareServers()`.
 */
export function setupServer(config: ServerTestConfiguration) {
  let outputDir: string | undefined;
  let server: BackgroundServer;

  beforeAll(async () => {
    console.time('export-server');
    const [newOutputDir, outputName] = await config.prepareDist();
    console.timeEnd('export-server');
    outputDir = newOutputDir;
    server = config.createServer();
    if (outputName) {
      await server.startAsync([outputName]);
    } else {
      await server.startAsync();
    }
  });

  afterAll(async () => {
    await server.stopAsync(true);
  });

  return {
    fetchAsync: (url: string, init?: RequestInit) => server.fetchAsync(url, init, {attempts: 7}),
    get outputDir() {
      if (!outputDir) {
        throw new Error('`outputDir` not available, `beforeAll()` has not run yet');
      }

      return outputDir;
    },
    get serverName() {
      return config.name;
    },
    get isExpoServe() {
      return config.name === RUNTIME_EXPO_SERVE;
    },
    get isExpoStart() {
      return config.name === RUNTIME_EXPO_START;
    },
    get isExpress() {
      return config.name === RUNTIME_EXPRESS_SERVER;
    },
    get isWorkerd() {
      return config.name === RUNTIME_WORKERD;
    },
  };
}