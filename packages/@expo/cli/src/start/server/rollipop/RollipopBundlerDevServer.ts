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
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import ws from 'ws';

import type { BundleAssetWithFileHashes, ExportAssetMap } from '../../../export/saveAssets';
import * as Log from '../../../log';
import { CommandError } from '../../../utils/errors';
import type { BundlerStartOptions, DevServerInstance, MessageSocket } from '../BundlerDevServer';
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
export function resolveAnnouncedHost(bindHost: string): string {
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
 * The CLI <-> runtime message socket (`reload`, `devMenu`, `sendDevCommand`) is
 * relayed by proxying Rollipop's `/message` websocket: this server opens a
 * `ws` client to Rollipop and forwards CLI-originated commands to the runtime,
 * so `expo start`'s interactive reload / dev-menu actions keep working under the
 * rollipop bundler. HMR push itself still comes from Rollipop directly.
 *
 * TypeScript services (`startTypeScriptServices`) are Metro-only; Rollipop
 * does not implement that protocol.
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
    // Rollipop is deny-by-default: it does not implement React Server Components
    // or Expo Router DOM components. Its message socket is now relayed (see
    // `connectMessageSocket`), so `messageSocket` is enabled; TypeScript
    // services remain Metro-only and are not implemented by Rollipop.
    this.capabilities = {
      reactServerComponents: false,
      domComponents: false,
      messageSocket: true,
      typeScriptServices: false,
    };
  }

  /** The spawned `rollipop start` process, if running. */
  private child: ChildProcess | null = null;

  /**
   * WebSocket client that proxies Rollipop's `/message` endpoint. `null` until
   * (and unless) the relay connects. CLI-originated `reload`/`devMenu` commands
   * are forwarded over this socket to the runtime.
   */
  private messageSocketClient: ws.WebSocket | null = null;

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
      // Relay the message socket by proxying Rollipop's `/message` websocket
      // (see `connectMessageSocket`). The relay connects asynchronously after
      // Rollipop is up; until then `broadcast` is a safe no-op so an early
      // interactive `reload` before the socket is open is a silent no-op rather
      // than a crash.
      messageSocket: this.createMessageSocket(),
    };

    // Connect the message-socket relay to Rollipop (best-effort, retries until
    // Rollipop's server is accepting connections). Failures are logged but do
    // not abort the dev server.
    this.connectMessageSocket(announcedHost, port).catch((error) => {
      Log.warn(
        chalk`{yellow Rollipop message-socket relay failed to connect: ${error instanceof Error ? error.message : String(error)}}`
      );
    });

    // The base `startAsync` calls `getUrlCreator()` after `startImplementationAsync`
    // returns, which asserts `this.urlCreator` is initialized. Metro sets this up
    // inside its implementation; Rollipop must do the same so the dev server URL
    // (and the export pipeline that depends on it) is available.
    await this.initUrlCreator(options);

    return instance;
  }

  /**
   * Build the `MessageSocket` the base `BundlerDevServer` exposes to the CLI.
   * `broadcast` forwards CLI-originated commands to the runtime over the
   * Rollipop proxy socket using the React Native community message protocol
   * (`{ type, data }`), matching what `@react-native-community/cli-server-api`
   * expects. `getClientCount` reflects the live relay connection.
   */
  private createMessageSocket(): MessageSocket {
    return {
      broadcast: (method: string, params?: Record<string, any>) => {
        const client = this.messageSocketClient;
        if (!client || client.readyState !== ws.WebSocket.OPEN) {
          return;
        }
        client.send(JSON.stringify({ type: method, data: params ?? {} }));
      },
      getClientCount: () => (this.messageSocketClient?.readyState === ws.WebSocket.OPEN ? 1 : 0),
    };
  }

  /**
   * Open (and keep open) a `ws` client to Rollipop's `/message` endpoint so the
   * CLI can relay `reload`/`devMenu`/`sendDevCommand` to the runtime. Retries on
   * connection failure (Rollipop may not be listening yet) with a bounded backoff,
   * and auto-reconnects if the socket drops. Swallows errors so the dev server
   * lifecycle is never blocked by the relay.
   */
  private async connectMessageSocket(host: string, port: number): Promise<void> {
    const url = `ws://${host}:${port}/message`;
    const maxAttempts = 30;
    const baseDelayMs = 500;

    const attempt = async (attemptsLeft: number): Promise<void> => {
      try {
        await this.openMessageSocket(url);
      } catch (error) {
        if (attemptsLeft <= 0) {
          throw error;
        }
        await new Promise((resolve) => setTimeout(resolve, baseDelayMs));
        return attempt(attemptsLeft - 1);
      }
    };

    await attempt(maxAttempts);
  }

  private openMessageSocket(url: string): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      const client = new ws.WebSocket(url);

      const onOpen = () => {
        cleanup();
        this.messageSocketClient = client;
        resolve();
      };
      const onError = (error: Error) => {
        cleanup();
        client.terminate();
        reject(error);
      };
      const cleanup = () => {
        client.off('open', onOpen);
        client.off('error', onError);
      };

      client.on('open', onOpen);
      client.on('error', onError);
      // Auto-reconnect on a dropped connection so the relay stays alive for the
      // dev server's lifetime. We don't await this — it just keeps the client
      // refreshed in the background.
      client.on('close', () => {
        if (this.messageSocketClient === client) {
          this.messageSocketClient = null;
        }
        // Attempt a single reconnect shortly after a drop.
        setTimeout(() => {
          if (this.messageSocketClient === null) {
            this.openMessageSocket(url).catch(() => {});
          }
        }, 2000);
      });
    });
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
    const assetsDest = path.join(
      this.projectRoot,
      'dist',
      'rollipop-temp',
      `${options.platform}-assets`
    );
    fs.mkdirSync(assetsDest, { recursive: true });

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
      '--assets-dest',
      assetsDest,
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

    // Collect the native assets Rollipop copied into `assetsDest` during the
    // bundle. Previously this returned `assets: []`, which meant
    // `expo export --bundler rollipop` (and EAS Build) shipped a JS bundle with
    // NO assets — every image/font was missing at runtime. Rollipop emits the
    // same layout Metro's asset copier produces, so we walk `assetsDest` and
    // build the `BundleAssetWithFileHashes` records the export pipeline expects.
    const assets = this.collectRollipopAssets(assetsDest, options.platform);

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
      assets,
      files,
    };
  }

  /**
   * Walk the directory Rollipop copied native assets into and produce
   * `BundleAssetWithFileHashes` records. Each file on disk becomes one asset
   * entry; `fileHashes` is the md5 of the file contents (matching Metro's
   * `hashAssets` asset plugins), and `files` points at the emitted path so the
   * export pipeline can copy it into the final bundle output.
   */
  private collectRollipopAssets(assetsDest: string, platform: string): BundleAssetWithFileHashes[] {
    const result: BundleAssetWithFileHashes[] = [];
    if (!fs.existsSync(assetsDest)) {
      return result;
    }

    const walk = (dir: string): string[] => {
      const out: string[] = [];
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const abs = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          out.push(...walk(abs));
        } else {
          out.push(abs);
        }
      }
      return out;
    };

    for (const file of walk(assetsDest)) {
      const rel = path.relative(assetsDest, file);
      const ext = path.extname(file).slice(1);
      const baseName = path.basename(file, `.${ext}`);
      const fileContents = fs.readFileSync(file);
      const hash = crypto.createHash('md5').update(fileContents).digest('hex');

      // Mirrors the `AssetData` shape Metro's asset serializer produces. Only
      // the fields the export pipeline actually reads (`files`,
      // `httpServerLocation`, `name`, `type`, plus `fileHashes`) are required;
      // image dimensions are intentionally omitted (optional).
      result.push({
        __packager_asset: true,
        fileSystemLocation: path.dirname(file),
        httpServerLocation: `/assets/${path.dirname(rel)}`,
        hash,
        name: baseName,
        type: ext,
        scales: [1],
        files: [rel],
        fileHashes: [hash],
      });
    }

    return result;
  }

  public async stopAsync() {
    this.stopChild();
    if (this.messageSocketClient) {
      this.messageSocketClient.close();
      this.messageSocketClient = null;
    }
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
