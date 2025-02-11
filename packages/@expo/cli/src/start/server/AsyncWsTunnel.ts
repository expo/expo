import * as tunnel from '@expo/ws-tunnel';
import chalk from 'chalk';
import { randomBytes } from 'node:crypto';
import * as fs from 'node:fs';
import { hostname } from 'node:os';
import * as path from 'node:path';
import tempDir from 'temp-dir';

import * as Log from '../../log';
import { env } from '../../utils/env';
import { CommandError } from '../../utils/errors';

const debug = require('debug')('expo:start:server:ws-tunnel') as typeof console.log;

export class AsyncWsTunnel {
  /** Info about the currently running instance of tunnel. */
  private serverUrl: string | null = null;

  constructor(_projectRoot: string, port: number) {
    if (port !== 8081) {
      throw new CommandError(
        'WS_TUNNEL_PORT',
        `WS-tunnel only supports tunneling over port 8081, attempted to use port ${port}`
      );
    }
  }

  public getActiveUrl(): string | null {
    return this.serverUrl;
  }

  async startAsync(): Promise<void> {
    this.serverUrl = await tunnel.startAsync({
      ...getTunnelOptions(),
      onStatusChange(status) {
        if (status === 'disconnected') {
          Log.error(
            chalk.red(
              'Tunnel connection has been closed. This is often related to intermittent connection problems with the ws proxy servers. Restart the dev server to try connecting again.'
            ) + chalk.gray('\nCheck the Expo status page for outages: https://status.expo.dev/')
          );
        }
      },
    });

    debug('Tunnel URL:', this.serverUrl);
  }

  async stopAsync(): Promise<void> {
    debug('Stopping Tunnel');
    await tunnel.stopAsync();
    this.serverUrl = null;
  }
}

function getTunnelSession(): string {
  const leaseId = Buffer.from(hostname()).toString('base64url');
  const leaseFile = path.join(tempDir, `_ws_tunnel_lease_${leaseId}`);
  let session: string | null = null;
  try {
    session = fs.readFileSync(leaseFile, 'utf8').trim() || null;
  } catch {}
  if (!session) {
    do {
      // TODO(cedric): replace this with non-random data generated from server to manage and prevent overlapping sessions
      session = randomBytes(12).toString('base64url');
    } while (!/^[A-Za-z0-9]/.test(session));
    fs.writeFileSync(leaseFile, session, 'utf8');
  }
  return session;
}

function getTunnelOptions() {
  const userDefinedSubdomain = env.EXPO_TUNNEL_SUBDOMAIN;
  if (userDefinedSubdomain && typeof userDefinedSubdomain === 'string') {
    debug('Session:', userDefinedSubdomain);
    return { session: userDefinedSubdomain };
  } else {
    const session = getTunnelSession();
    return { session };
  }
}
