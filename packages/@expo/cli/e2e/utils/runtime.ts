import fs from 'node:fs';
import path from 'node:path';

import { getRouterE2ERoot, getServerTesterRoot } from '../__tests__/utils';
import { createExpoServe, createExpoStart, executeExpoAsync } from './expo';
import { executeAsync, processFindPrefixedValue } from './process';
import { BackgroundServer, createBackgroundServer } from './server';

export const RUNTIME_EXPO_SERVE = 'expo serve';
export const RUNTIME_EXPO_START = 'expo start';
export const RUNTIME_EXPRESS_SERVER = 'express';
export const RUNTIME_WORKERD = 'workerd';

type RuntimeType =
  | typeof RUNTIME_EXPO_SERVE
  | typeof RUNTIME_EXPO_START
  | typeof RUNTIME_EXPRESS_SERVER
  | typeof RUNTIME_WORKERD;

export type ServerTestConfiguration = {
  name: string;
  createServer: (overrideServe?: ServerTestOptions['serve']) => BackgroundServer;
  prepareDist: () => Promise<[outputDir: string, outputName?: string]>;
};

/** The app under `apps/` that hosts the routes. */
export type E2EApp = 'router-e2e' | 'server-tester';

export type ServerTestOptions = {
  /** The app under `apps/` that hosts the routes. Defaults to `router-e2e`. */
  app?: E2EApp;
  /** The `__e2e__` scenario directory inside `router-e2e` (e.g., 'server-root-group'). Required for that app, unused for `server-tester`. */
  fixtureName?: string;
  /** A unique value to ensure the output directory is not overwritten by another test running in parallel. Useful for tests that share the same `fixtureName` */
  uniqueOutputKey?: string;
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
 *     app: 'server-tester',
 *   })
 * )('$name requests', (config) => {
 *   const ctx = setupServer(config);
 *   it('can serve html', async () => {
 *     expect(await ctx.fetchAsync('/').then((r) => r.text())).toMatch(/<div id="root">/);
 *   });
 * });
 * ```
 */
export function prepareServers(
  runtimes: RuntimeType[],
  options: ServerTestOptions
): ServerTestConfiguration[] {
  const { uniqueOutputKey } = options;
  const app = resolveApp(options);
  const { projectRoot } = app;

  const exportEnv = options.export?.env ?? {};
  const exportCliFlags = options.export?.cliFlags ?? [];
  const serveEnv = options.serve?.env ?? {};

  const defaultExportEnv = {
    NODE_ENV: 'production',
    EXPO_USE_STATIC: 'server',
    ...app.env,
    ...exportEnv,
  } as const;

  let sharedProductionExport: Promise<string> | undefined;

  async function prepareProductionDist(runtimeName: string) {
    const sharedOutputName = generateOutputDir('shared', app.outputPrefix, uniqueOutputKey);
    const sharedOutputDir = path.join(projectRoot, sharedOutputName);

    sharedProductionExport ??= executeExpoAsync(
      projectRoot,
      ['export', '-p', 'web', '--output-dir', sharedOutputName, ...exportCliFlags],
      { env: defaultExportEnv }
    ).then(() => sharedOutputDir);

    const sourceDir = await sharedProductionExport;
    const outputName = generateOutputDir(runtimeName, app.outputPrefix, uniqueOutputKey);
    const outputDir = path.join(projectRoot, outputName);

    await fs.promises.rm(outputDir, { force: true, recursive: true });
    await fs.promises.cp(sourceDir, outputDir, { recursive: true });

    return [outputDir, outputName] as const;
  }

  const knownRuntimeConfigs: Record<RuntimeType, Omit<ServerTestConfiguration, 'name'>> = {
    [RUNTIME_EXPO_SERVE]: {
      prepareDist: async () => {
        return await prepareProductionDist('expo-serve');
      },
      createServer: (overrideServe) =>
        createExpoServe({
          cwd: projectRoot,
          env: {
            NODE_ENV: 'production',
            ...serveEnv,
            ...overrideServe?.env,
          },
        }),
    },
    [RUNTIME_EXPO_START]: {
      prepareDist: async () => {
        return [''];
      },
      createServer: (overrideServe) =>
        createExpoStart({
          cwd: projectRoot,
          env: {
            ...defaultExportEnv,
            ...serveEnv,
            ...overrideServe?.env,
            NODE_ENV: 'development',
          },
        }),
    },
    [RUNTIME_EXPRESS_SERVER]: {
      prepareDist: async () => {
        return await prepareProductionDist('express');
      },
      createServer: (overrideServe) =>
        createBackgroundServer({
          command: ['node', app.expressScript],
          host: (chunk: any) => processFindPrefixedValue(chunk, 'Express server listening'),
          cwd: projectRoot,
          env: {
            NODE_ENV: 'production',
            ...serveEnv,
            ...overrideServe?.env,
          },
        }),
    },
    [RUNTIME_WORKERD]: {
      prepareDist: async () => {
        const [outputDir] = await prepareProductionDist('workerd');

        await executeAsync(projectRoot, [
          'node_modules/.bin/esbuild',
          '--bundle',
          '--format=esm',
          '--platform=node',
          `--outfile=${path.join(outputDir, 'server/workerd.js')}`,
          path.join(app.workerdDir, 'workerd.mjs'),
        ]);
        fs.copyFileSync(
          path.join(app.workerdDir, 'config.capnp'),
          path.join(outputDir, 'server/config.capnp')
        );

        return [outputDir];
      },
      createServer: (overrideServe) =>
        createBackgroundServer({
          command: [
            'node_modules/.bin/workerd',
            'serve',
            path.join(
              projectRoot,
              generateOutputDir('workerd', app.outputPrefix, uniqueOutputKey),
              'server/config.capnp'
            ),
          ],
          host: (chunk: any) => processFindPrefixedValue(chunk, 'Workerd server listening'),
          port: 8787,
          cwd: projectRoot,
          env: {
            ...overrideServe?.env,
          },
        }),
    },
  };

  const knownRuntimes = Object.keys(knownRuntimeConfigs);

  return runtimes.map((runtime) => {
    if (!knownRuntimes.includes(runtime)) {
      throw new Error(`Unknown runtime "${runtime}". Known runtimes: ${knownRuntimes.join(', ')}`);
    }

    const config = knownRuntimeConfigs[runtime];
    let preparedDist: ReturnType<ServerTestConfiguration['prepareDist']> | undefined;

    return {
      ...config,
      name: runtime,
      // A configuration can be reused by multiple describe blocks that vary only the server
      // environment. The exported files are identical, so prepare them once for the test file.
      prepareDist: () => (preparedDist ??= config.prepareDist()),
    };
  });
}

/**
 * Sets up server lifecycle (`beforeAll()`/`afterAll()`) and returns a test context.
 *
 * @remarks Must be called at the top level of a `describe()` block that uses `prepareServers()`.
 */
export function setupServer(
  /** Server configuration from `prepareServers()` */
  config: ServerTestConfiguration,
  /** Optional overrides to pass to `expo serve` for this specific test scenario */
  options?: Pick<ServerTestOptions, 'serve'>
) {
  let outputDir: string | undefined;
  let server: BackgroundServer;

  beforeAll(async () => {
    console.time('export-server');
    const [newOutputDir, outputName] = await config.prepareDist();
    console.timeEnd('export-server');
    outputDir = newOutputDir;
    server = config.createServer(options?.serve);
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
    fetchAsync: (url: string, init?: RequestInit) => server.fetchAsync(url, init, { attempts: 7 }),
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

type ResolvedApp = {
  projectRoot: string;
  /** Environment variables that select the routes inside the app. */
  env: Record<string, string>;
  /** Absolute path of the Express adapter script. */
  expressScript: string;
  /** Absolute path of the directory with `workerd.mjs` and `config.capnp`. */
  workerdDir: string;
  /** Segment that keeps output directories of different fixtures apart. Empty when the app has one set of routes. */
  outputPrefix: string;
};

function resolveApp({ app = 'router-e2e', fixtureName }: ServerTestOptions): ResolvedApp {
  switch (app) {
    case 'router-e2e': {
      if (!fixtureName) {
        throw new Error('`fixtureName` is required when the app is "router-e2e"');
      }
      const projectRoot = getRouterE2ERoot();
      const fixtureRoot = path.join(projectRoot, '__e2e__', fixtureName);
      return {
        projectRoot,
        env: { E2E_ROUTER_SRC: fixtureName },
        expressScript: path.join(fixtureRoot, 'express.js'),
        workerdDir: path.join(fixtureRoot, 'workerd'),
        outputPrefix: fixtureName,
      };
    }
    case 'server-tester': {
      const projectRoot = getServerTesterRoot();
      return {
        projectRoot,
        env: {},
        expressScript: path.join(projectRoot, 'servers/express.js'),
        workerdDir: path.join(projectRoot, 'servers/workerd'),
        outputPrefix: '',
      };
    }
  }
}

function generateOutputDir(runtimeName: string, outputPrefix: string, uniqueOutputKey?: string) {
  return ['dist', outputPrefix, runtimeName, uniqueOutputKey].filter(Boolean).join('-');
}
