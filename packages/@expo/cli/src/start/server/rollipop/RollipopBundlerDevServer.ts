/**
 * Copyright © 2026 650 Industries.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import chalk from 'chalk';
import { spawn } from 'child_process';
import type { ChildProcess } from 'child_process';
import { createRequire } from 'module';
import fs from 'node:fs';
import path from 'node:path';

import * as Log from '../../../log';
import { CommandError } from '../../../utils/errors';
import type { BundlerStartOptions, DevServerInstance } from '../BundlerDevServer';
import { BundlerDevServer } from '../BundlerDevServer';

const ROLLIPOP_BIN = 'rollipop';

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
    const env: NodeJS.ProcessEnv = {
      ...process.env,
      EXPO_BUNDLER: 'rollipop',
      // Allow Rollipop to read the same environment files as Metro.
      ROLLIPOP_ENV_DIR: projectRoot,
    };

    const bin = this.resolveRollipopBin();
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

    const serverUrl = `http://${host === '0.0.0.0' ? 'localhost' : host}:${port}`;

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
    files: Map<string, any>
  ): Promise<{
    artifacts: {
      type: 'js';
      originFilename: string;
      filename: string;
      source: string;
      metadata: Record<string, any>;
    }[];
    assets: readonly any[];
    files?: Map<string, any>;
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
      ...(options.mainModuleName ? ['--entry-file', options.mainModuleName] : []),
    ];

    Log.log(chalk`{gray Running Rollipop production bundle for ${options.platform}}`);

    await new Promise<void>((resolve, reject) => {
      const child = spawn(bin, args, {
        cwd: this.projectRoot,
        env: { ...process.env, EXPO_BUNDLER: 'rollipop' },
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
    // Prefer the locally-linked `rollipop` binary on PATH; fall back to a
    // workspace/monorepo resolution from the project root.
    try {
      const projectRequire = createRequire(path.join(this.projectRoot, 'package.json'));
      return projectRequire.resolve('rollipop/bin/index.js');
    } catch {
      return ROLLIPOP_BIN;
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
