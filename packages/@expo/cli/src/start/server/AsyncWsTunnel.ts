import * as tunnel from '@expo/ws-tunnel';
import chalk from 'chalk';
import * as fs from 'node:fs';
import { tmpdir, hostname } from 'node:os';
import * as path from 'node:path';

import * as Log from '../../log';
import { env, envIsWebcontainer } from '../../utils/env';
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
  return (Math.random().toString(36) + '00000').slice(2, 7);
}

function getTunnelSession(): string {
  let session = randomStr() + randomStr() + randomStr();
  if (envIsWebcontainer()) {
    const leaseId = Buffer.from(hostname()).toString('base64url');
    const leaseFile = path.join(tmpdir(), `_ws_tunnel_lease_${leaseId}`);
    try {
      session = fs.readFileSync(leaseFile, 'utf8').trim() || session;
    } catch {}
    try {
      fs.writeFileSync(leaseFile, session, 'utf8');
    } catch {}
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
