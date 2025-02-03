import * as tunnel from '@expo/ws-tunnel';
import chalk from 'chalk';
import { randomBytes } from 'node:crypto';

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
        } else if (status === 'connected') {
          Log.log('Tunnel connected.');
        }
      },
    });

    debug('Tunnel URL:', this.serverUrl);
    Log.log('Tunnel ready.');
  }

  async stopAsync(): Promise<void> {
    debug('Stopping Tunnel');
    await tunnel.stopAsync();
    this.serverUrl = null;
  }
}

function getTunnelOptions() {
  const userDefinedSubdomain = env.EXPO_TUNNEL_SUBDOMAIN;
  if (userDefinedSubdomain && typeof userDefinedSubdomain === 'string') {
    debug('Session:', userDefinedSubdomain);
    return { session: userDefinedSubdomain };
  }

  let session: string;
  do {
    session = randomBytes(12).toString('base64url');
  } while (!/^[A-Za-z0-9]/.test(session));
  debug('Session:', session);
  return { session };
}
