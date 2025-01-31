import chalk from 'chalk';
import { randomBytes } from 'node:crypto';

import * as Log from '../../log';
import { env } from '../../utils/env';
import { CommandError } from '../../utils/errors';
import { WsTunnelResolver } from '../doctor/tunnel/WsTunnelResolver';

const debug = require('debug')('expo:start:server:ws-tunnel') as typeof console.log;

export class AsyncWsTunnel {
  /** Resolves the best instance of the WS tunnel, exposed for testing. */
  resolver: WsTunnelResolver;

  /** Info about the currently running instance of tunnel. */
  private serverUrl: string | null = null;

  constructor(
    private projectRoot: string,
    port: number
  ) {
    if (port !== 8081) {
      throw new CommandError(
        'WS_TUNNEL_PORT',
        `The WS-tunnel only supports tunneling over port 8081, attempted to use port ${port}`
      );
    }

    this.resolver = new WsTunnelResolver(projectRoot);
  }

  public getActiveUrl(): string | null {
    return this.serverUrl;
  }

  async startAsync(): Promise<void> {
    const instance = await this.resolver.resolveAsync({
      autoInstall: true,
      shouldPrompt: false,
      // Webcontainers do not support installing packages globally
      prefersGlobalInstall: false,
    });

    this.serverUrl = await instance.startAsync({
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
    await this.resolver.get()?.stopAsync();
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
