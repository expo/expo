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

// Generate a base-36 string of 5 characters (from 32 bits of randomness)
function randomStr() {
  const MASK = (1 << 5) - 1;
  let x = 1 + Math.round(Math.random() * (~1 >>> 0));
  let out = '';
  for (let i = 0; i < 5; i++, x = x >> 5) out += (x & MASK).toString(36);
  return out;
}

function getTunnelSession(): string {
  const leaseId = Buffer.from(hostname()).toString('base64url');
  const leaseFile = path.join(tempDir, `_ws_tunnel_lease_${leaseId}`);
  let session: string | null = null;
  try {
    session = fs.readFileSync(leaseFile, 'utf8').trim() || null;
  } catch {}
  if (!session) {
    // NOTE(@kitten): Randomness should be about 2.21e+23
    session = randomStr() + randomStr() + randomStr();
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
