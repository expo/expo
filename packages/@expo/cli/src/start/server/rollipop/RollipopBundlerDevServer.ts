/**
 * Copyright © 2026 650 Industries.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { SerialAsset } from '@expo/metro-config/build/serializer/serializerAssets';
import chalk from 'chalk';
import { spawn } from 'child_process';
import type { ChildProcess } from 'child_process';
import { createRequire } from 'module';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import type { BundleAssetWithFileHashes, ExportAssetMap } from '../../../export/saveAssets';
import * as Log from '../../../log';
import { CommandError } from '../../../utils/errors';
import type { BundlerStartOptions, DevServerInstance } from '../BundlerDevServer';
import { BundlerDevServer } from '../BundlerDevServer';
import DevToolsPluginManager from '../DevToolsPluginManager';
import type { PlatformBundlers } from '../platformBundlers';

const ROLLIPOP_BIN = 'rollipop';

/**
 * Resolve the host the iOS Simulator / dev client should connect to.
 *
 * The simulator's loopback namespace is isolated from the host, so `localhost`
 * does not work from the simulator — we must announce a host-reachable address.
 * Precedence:
 *   1. `ROLLIPOP_DEV_HOST` env var (explicit override for VMs / custom networks).
 *   2. A non-internal IPv4 chosen deterministically (first interface whose
 *      address is reachable from outside the machine).
 *   3. `localhost` as a last resort (works for `expo start` on the same host
 *      when the client is not a simulator).
 */
function resolveAnnouncedHost(bindHost: string): string {
  // When bound to all interfaces, loopback is unreachable from the simulator.
  if (bindHost !== '0.0.0.0') {
    return bindHost;
  }

  const explicit = process.env.ROLLIPOP_DEV_HOST;
  if (explicit) {
    return explicit;
  }

  const ifaces = os.networkInterfaces();
  for (const list of Object.values(ifaces)) {
    for (const ni of list ?? []) {
      if (ni.family === 'IPv4' && !ni.internal) {
        return ni.address;
      }
    }
  }
  return 'localhost';
}

/**
 * A `BundlerDevServer` that delegates bundling to Rollipop (the Rolldown-based
 * React Native bundler) instead of Metro.
 *
 * Rollipop ships its own dev server (HMR, asset serving, message socket) and its
 * own CLI. `@expo/cli` does not import Rollipop's internals — it spawns the
 * `rollipop start` process and forwards the dev-server lifecycle so Expo Go /
 * Dev Client launches keep working. This is the `expo start --bundler rollipop`
 * integration point.
 *
 * Known follow-ups (tracked separately from this wiring):
 * - Relay the runtime <-> CLI message socket (`reload`, `devMenu`) by proxying
 *   Rollipop's `/message` websocket. For now `broadcastMessage` is a no-op
 *   because Rollipop owns the socket; HMR push comes from Rollipop directly.
 * - TypeScript services (`startTypeScriptServices`) are Metro-only; Rollipop
 *   does not implement that protocol.
 */
export class RollipopBundlerDevServer extends BundlerDevServer {
  get name(): string {
    return 'rollipop';
  }

  constructor(
    projectRoot: string,
    platformBundlers: PlatformBundlers,
    options?: { devToolsPluginManager?: DevToolsPluginManager }
  ) {
    super(projectRoot, platformBundlers, options);
    // Rollipop is deny-by-default: it does not implement React Server Components,
    // Expo Router DOM components, or Metro's TypeScript services. Its message
    // socket is owned by the child process and not relayed to the CLI, so we
    // report `messageSocket: false` (the instance's broadcast is a no-op).
    this.capabilities = {
      reactServerComponents: false,
      domComponents: false,
      messageSocket: false,
      typeScriptServices: false,
    };
  }

  /** The spawned `rollipop start` process, if running. */
  private child: ChildProcess | null = null;

  protected async startImplementationAsync(
    options: BundlerStartOptions
  ): Promise<DevServerInstance> {
    const port = options.port ?? 8081;
    const host = options.location.hostType === 'localhost' ? 'localhost' : '0.0.0.0';

    const projectRoot = this.projectRoot;

    // Tell Rollipop to read the project's `@expo/metro-config` and activate its
    // Expo compatibility mode (aliases, asset extensions, Expo Router manifest).
    const bin = this.resolveRollipopBin();
    const env: NodeJS.ProcessEnv = {
      ...process.env,
      EXPO_BUNDLER: 'rollipop',
      // Allow Rollipop to read the same environment files as Metro.
      ROLLIPOP_ENV_DIR: projectRoot,
      // Expose Rollipop's own node_modules so its `@expo/metro-config` (a
      // Rollipop dependency) resolves from the project root without a symlink.
      ...(this.resolveRollipopNodeModules()
        ? { NODE_PATH: this.resolveRollipopNodeModules() as string }
        : {}),
      // Hand Rollipop the resolved `@expo/metro-config` path (from this CLI's
      // node_modules) so Expo compatibility works without a symlink.
      ...(this.resolveExpoMetroConfigPath()
        ? { ROLLIPOP_EXPO_METRO_CONFIG: this.resolveExpoMetroConfigPath() as string }
        : {}),
    };

    Log.log(chalk`{gray Starting Rollipop dev server on port ${port}}`);

    const child = spawn(
      bin,
      [
        'start',
        '--port',
        String(port),
        '--host',
        host,
        ...(options.resetDevServer ? ['--reset-cache'] : []),
        ...(options.https ? ['--https'] : []),
      ],
      {
        cwd: projectRoot,
        env,
        stdio: ['ignore', 'pipe', 'pipe'],
      }
    );

    child.stdout?.on('data', (chunk) => {
      process.stdout.write(chunk);
    });
    child.stderr?.on('data', (chunk) => {
      process.stderr.write(chunk);
    });
    child.on('error', (error) => {
      throw new CommandError('ROLLIPOP_START', `Failed to start Rollipop: ${error.message}`);
    });

    this.child = child;

    // When bound to all interfaces (0.0.0.0) the loopback `localhost` is not
    // reachable from the iOS Simulator (its loopback namespace is isolated from
    // the host). Announce the LAN address so the simulator/dev client can connect.
    const announcedHost = resolveAnnouncedHost(host);
    const serverUrl = `http://${announcedHost}:${port}`;

    const instance: DevServerInstance = {
      server: {
        close: (callback?: (err?: Error) => void) => {
          this.stopChild();
          callback?.();
        },
        addListener() {},
      },
      location: {
        url: serverUrl,
        port,
        protocol: 'http',
        host,
      },
      middleware: {},
      // Message socket is owned by the Rollipop child process. HMR / reload
      // events are pushed by Rollipop directly to the runtime; CLI-originated
      // `reload`/`devMenu` relay is a tracked follow-up (see class doc).
      messageSocket: {
        broadcast: () => {},
        getClientCount: () => 0,
      },
    };

    // The base `startAsync` calls `getUrlCreator()` after `startImplementationAsync`
    // returns, which asserts `this.urlCreator` is initialized. Metro sets this up
    // inside its implementation; Rollipop must do the same so the dev server URL
    // (and the export pipeline that depends on it) is available.
    await this.initUrlCreator(options);

    return instance;
  }

  /**
   * Production export entry point used by `expo export` (see `exportApp.ts`).
   *
   * Rollipop does not share Metro's `SerialAsset` serializer, so we shell out to
   * `rollipop bundle` and adapt the single-file output into the
   * `{ artifacts, assets, files }` shape the export pipeline consumes. The
   * rollipop bundle is the entire module graph for the platform (no async
   * chunk splitting), which matches the single `index.js` artifact Metro
   * produces for non-split platforms.
   */
  public async nativeExportBundleAsync(
    _exp: any,
    options: any,
    files: ExportAssetMap
  ): Promise<{
    artifacts: SerialAsset[];
    assets: readonly BundleAssetWithFileHashes[];
    files?: ExportAssetMap;
  }> {
    const bundleOutput = path.join(
      this.projectRoot,
      'dist',
      'rollipop-temp',
      `${options.platform}.bundle`
    );
    const sourcemapOutput = options.serializerIncludeMaps
      ? path.join(this.projectRoot, 'dist', 'rollipop-temp', `${options.platform}.map`)
      : undefined;

    fs.mkdirSync(path.dirname(bundleOutput), { recursive: true });

    // Resolve the entry file. Expo's `resolveRelativeEntryPoint` computes
    // `mainModuleName` (e.g. the Expo Router entry). Rollipop resolves the
    // entry differently from Metro and can fail on some project layouts where
    // that computed path does not directly exist on disk. If the computed
    // entry isn't resolvable, fall back to `index.js` — the app entry that
    // re-exports Expo Router — which Rollipop bundles correctly.
    const computedEntry = options.mainModuleName ?? 'index.js';
    const resolvedEntry = fs.existsSync(path.resolve(this.projectRoot, computedEntry))
      ? computedEntry
      : 'index.js';

    const bin = this.resolveRollipopBin();
    const args = [
      'bundle',
      '--platform',
      options.platform,
      '--dev',
      String(!!options.dev),
      '--minify',
      String(options.minify ?? !options.dev),
      '--bundle-output',
      bundleOutput,
      ...(sourcemapOutput ? ['--sourcemap-output', sourcemapOutput] : []),
      '--entry-file',
      resolvedEntry,
    ];

    Log.log(chalk`{gray Running Rollipop production bundle for ${options.platform}}`);

    await new Promise<void>((resolve, reject) => {
      const child = spawn(bin, args, {
        cwd: this.projectRoot,
        env: {
          ...process.env,
          EXPO_BUNDLER: 'rollipop',
          // Propagate the React Native path so Rollipop's Expo compatibility mode
          // can resolve `react-native` the same way `expo start --bundler rollipop`
          // does. Without this, Rollipop fails to load `@expo/metro-config`.
          ...(process.env.ROLLIPOP_REACT_NATIVE_PATH
            ? { ROLLIPOP_REACT_NATIVE_PATH: process.env.ROLLIPOP_REACT_NATIVE_PATH }
            : {}),
          // Expose Rollipop's own node_modules so its `@expo/metro-config`
          // (a Rollipop dependency) resolves from the project root without a
          // symlink inside the consuming app.
          ...(this.resolveRollipopNodeModules()
            ? { NODE_PATH: this.resolveRollipopNodeModules() as string }
            : {}),
          // Hand Rollipop the resolved `@expo/metro-config` path (from this CLI's
          // node_modules) so Expo compatibility works without a symlink.
          ...(this.resolveExpoMetroConfigPath()
            ? { ROLLIPOP_EXPO_METRO_CONFIG: this.resolveExpoMetroConfigPath() as string }
            : {}),
        },
        stdio: ['ignore', 'pipe', 'pipe'],
      });
      child.stdout?.on('data', (chunk) => process.stdout.write(chunk));
      child.stderr?.on('data', (chunk) => process.stderr.write(chunk));
      child.on('error', (error) =>
        reject(new CommandError('ROLLIPOP_BUNDLE', `Failed to run Rollipop: ${error.message}`))
      );
      child.on('close', (code) =>
        code === 0
          ? resolve()
          : reject(new CommandError('ROLLIPOP_BUNDLE', `Rollipop exited with code ${code}`))
      );
    });

    const source = fs.readFileSync(bundleOutput, 'utf8');
    const filename = 'index.js';

    return {
      artifacts: [
        {
          type: 'js',
          originFilename: options.mainModuleName ?? 'index.js',
          filename,
          source,
          metadata: {},
        },
      ],
      assets: [],
      files,
    };
  }

  public async stopAsync() {
    this.stopChild();
    await super.stopAsync();
  }

  private stopChild() {
    if (this.child) {
      this.child.kill('SIGTERM');
      this.child = null;
    }
  }

  private resolveRollipopBin(): string {
    // Explicit override for tests/CI or when `rollipop` is not a project
    // dependency. Avoids relying on a hand-wired symlink in the app.
    if (process.env.ROLLIPOP_BIN) return process.env.ROLLIPOP_BIN;
    try {
      const projectRequire = createRequire(path.join(this.projectRoot, 'package.json'));
      // rollipop's package.json `exports` map does not expose `./bin/index.js`,
      // so resolve the package root (self-reference is always allowed) and
      // append the bin path explicitly.
      const pkgJson = projectRequire.resolve('rollipop/package.json');
      return path.join(path.dirname(pkgJson), 'bin', 'index.js');
    } catch {
      return ROLLIPOP_BIN;
    }
  }

  /**
   * Returns the `node_modules` directory that belongs to the resolved Rollipop
   * package. Rollipop's Expo compatibility mode needs `@expo/metro-config`
   * (one of Rollipop's own dependencies) resolvable from the project root;
   * pnpm only links it inside Rollipop's own `node_modules`. Exposing it via
   * `NODE_PATH` lets the spawned Rollipop child find it without requiring a
   * symlink inside the consuming app.
   */
  private resolveRollipopNodeModules(): string | undefined {
    const bin = this.resolveRollipopBin();
    // bin is `<pkg>/bin/index.js`; the package root is two levels up.
    const pkgRoot = path.dirname(path.dirname(bin));
    const nodeModules = path.join(pkgRoot, 'node_modules');
    try {
      fs.accessSync(nodeModules);
      return nodeModules;
    } catch {
      return undefined;
    }
  }

  /**
   * Resolves the `@expo/metro-config` package path from THIS CLI's own
   * `node_modules` (it's a direct dependency of `@expo/cli`). Rollipop's Expo
   * compatibility mode needs `@expo/metro-config`; when the consuming app does
   * not hoist it (pnpm strict mode), we hand Rollipop the resolved path via the
   * `ROLLIPOP_EXPO_METRO_CONFIG` env var instead of requiring a symlink.
   */
  private resolveExpoMetroConfigPath(): string | undefined {
    try {
      // Anchor resolution at this module's directory; `@expo/metro-config` is a
      // direct dependency of `@expo/cli` and is found by walking up through
      // node_modules. (The CLI builds to CommonJS, so `__dirname` is used rather
      // than `import.meta.url`.)
      const selfRequire = createRequire(__dirname);
      return selfRequire.resolve('@expo/metro-config');
    } catch {
      return undefined;
    }
  }

  protected getConfigModuleIds(): string[] {
    return ['rollipop.config.ts', 'rollipop.config.js', 'app.json', 'app.config.js'];
  }

  public async startTypeScriptServices(): Promise<void> {
    // TypeScript services are provided by Metro; Rollipop does not implement
    // the Metro symbolication/TS service protocol, so this is a no-op.
  }
}
