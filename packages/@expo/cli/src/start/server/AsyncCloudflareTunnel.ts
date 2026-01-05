import chalk from 'chalk';
import { spawn, type ChildProcessWithoutNullStreams } from 'node:child_process';

import * as Log from '../../log';
import { delayAsync, resolveWithTimeout } from '../../utils/delay';
import { env } from '../../utils/env';
import { CommandError } from '../../utils/errors';

const debug = require('debug')('expo:start:server:cloudflare') as typeof console.log;

const TUNNEL_TIMEOUT = 10 * 1000;

export class AsyncCloudflareTunnel {
  /** Info about the currently running instance of cloudflared. */
  private serverUrl: string | null = null;
  private child: ChildProcessWithoutNullStreams | null = null;

  constructor(
    private projectRoot: string,
    private port: number
  ) {}

  public getActiveUrl(): string | null {
    return this.serverUrl;
  }

  async startAsync({ timeout }: { timeout?: number } = {}): Promise<void> {
    this.serverUrl = await this._connectToCloudflareAsync({ timeout });

    debug('Tunnel URL:', this.serverUrl);
    Log.log('Tunnel ready.');
  }

  async stopAsync(): Promise<void> {
    debug('Stopping Cloudflare tunnel');
    if (this.child) {
      this.child.removeAllListeners();
      // Gracefully terminate the child process; fall back to SIGKILL if it lingers.
      this.child.kill();
      const proc = this.child;
      this.child = null;
      await Promise.race([
        new Promise<void>((resolve) => proc.once('exit', () => resolve())),
        delayAsync(1000),
      ]);
    }
    this.serverUrl = null;
  }

  private async _connectToCloudflareAsync(
    options: { timeout?: number } = {},
    attempts: number = 0
  ): Promise<string> {
    await this.stopAsync();

    debug('Using project root', this.projectRoot);
    const cloudflaredBin = env.EXPO_CLOUDFLARED_PATH || 'cloudflared';
    const args = [
      'tunnel',
      '--no-autoupdate',
      '--url',
      `http://localhost:${this.port}`,
    ];

    debug('Starting cloudflared:', cloudflaredBin, args.join(' '));

    let child: ChildProcessWithoutNullStreams;
    try {
      child = spawn(cloudflaredBin, args, {
        stdio: ['ignore', 'pipe', 'pipe'],
      });
    } catch (error: any) {
      throw new CommandError(
        'CLOUDFLARE_TUNNEL_START',
        `Failed to launch cloudflared (${cloudflaredBin}). Install it from https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/installation/ or set EXPO_CLOUDFLARED_PATH.\n${error?.message ?? error}`
      );
    }

    this.child = child;

    try {
      const result = await resolveWithTimeout(
        () => this.readCloudflareUrlAsync(child, attempts),
        {
          timeout: options.timeout ?? TUNNEL_TIMEOUT,
          errorMessage: 'cloudflare tunnel took too long to connect.',
        }
      );
      if (typeof result === 'string') {
        return result;
      }
    } catch (error) {
      await this.stopAsync();
      throw error;
    }

    // Stop any existing process before retrying.
    await this.stopAsync();
    // Wait 100ms and then try again
    await delayAsync(100);

    return this._connectToCloudflareAsync(options, attempts + 1);
  }

  private async readCloudflareUrlAsync(
    child: ChildProcessWithoutNullStreams,
    attempts: number
  ): Promise<string | false> {
    return await new Promise((resolve, reject) => {
      let resolved: string | null = null;
      const cleanup = () => {
        child.stdout.removeListener('data', onOutput);
        child.stderr.removeListener('data', onOutput);
        child.removeListener('exit', onExit);
        child.removeListener('error', onError);
      };

      const onExit = (code: number | null) => {
        cleanup();
        if (resolved) {
          resolve(resolved);
          return;
        }
        reject(
          new CommandError(
            'CLOUDFLARE_TUNNEL_START',
            `cloudflared exited unexpectedly (code ${code ?? 'unknown'}).`
          )
        );
      };
      const onError = (error: Error) => {
        cleanup();
        reject(
          new CommandError(
            'CLOUDFLARE_TUNNEL_START',
            `Failed to start cloudflared. ${error.message}`
          )
        );
      };

      const onOutput = (buffer: Buffer) => {
        const text = buffer.toString();
        debug(text.trim());

        const match = text.match(/https?:\/\/[-\w.]+\.trycloudflare\.com/);
        if (match?.[0]) {
          resolved = match[0];
          cleanup();
          resolve(resolved);
        }
      };

      child.stdout.on('data', onOutput);
      child.stderr.on('data', onOutput);
      child.on('exit', onExit);
      child.on('error', onError);
    }).catch(async (error) => {
      // Attempt to retry in a limited fashion.
      if (attempts >= 2) {
        throw error;
      }
      return false;
    });
  }
}
