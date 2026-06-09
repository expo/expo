import { getConfig } from '@expo/config';
import * as tunnel from '@expo/ws-tunnel';
import chalk from 'chalk';
import * as fs from 'node:fs';
import { tmpdir, hostname } from 'node:os';
import * as path from 'node:path';

import { TunnelMutation } from '../../api/graphql/mutations/TunnelMutation';
import { AppQuery } from '../../api/graphql/queries/AppQuery';
import { hasCredentials } from '../../api/user/UserSettings';
import { getUserAsync } from '../../api/user/user';
import * as Log from '../../log';
import { env, envIsWebcontainer } from '../../utils/env';
import { CommandError } from '../../utils/errors';

const debug = require('debug')('expo:start:server:ws-tunnel') as typeof console.log;

export interface AsyncWsTunnelOptions {
  useExpoAccount?: boolean;
}

export class AsyncWsTunnel {
  private serverUrl: URL | null = null;

  constructor(
    private projectRoot: string,
    private port: number,
    private options: AsyncWsTunnelOptions = {}
  ) {}

  public getActiveUrl(): string | null {
    return this.serverUrl?.href ?? null;
  }

  async startAsync(): Promise<void> {
    this.serverUrl = await tunnel.startAsync({
      ...(await this.getTunnelOptionsAsync()),
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

    debug('Tunnel URL:', this.serverUrl.href);
  }

  private async getTunnelOptionsAsync(): Promise<tunnel.WsTunnelOptions> {
    if (this.options.useExpoAccount) {
      return this.getExpoAccountTunnelOptionsAsync();
    } else {
      return getLegacyTunnelOptions(this.port);
    }
  }

  private async getExpoAccountTunnelOptionsAsync(): Promise<tunnel.WsTunnelOptions> {
    const apiUrl = await getExpoAccountTunnelUrlAsync(this.projectRoot);
    if (!apiUrl) {
      const cause = hasCredentials()
        ? `Your Expo account may not have access to it, or the tunnel service is unavailable.`
        : `You're not logged in to your Expo account — run 'npx expo login'.`;
      throw new CommandError(
        'WS_TUNNEL_SIGNED_URL',
        `Couldn't create a signed tunnel URL for this project. ${cause} ` +
          `Unset EXPO_UNSTABLE_TUNNEL_V2 to use an ngrok tunnel instead.`
      );
    }
    return { apiUrl, targetUrl: `http://localhost:${this.port}` };
  }

  async stopAsync(): Promise<void> {
    debug('Stopping Tunnel');
    await tunnel.stopAsync();
    this.serverUrl = null;
  }
}

function getLegacyTunnelOptions(port: number): tunnel.WsTunnelOptions {
  if (port !== 8081) {
    throw new CommandError(
      'WS_TUNNEL_PORT',
      `WS-tunnel only supports tunneling over port 8081, attempted to use port ${port}`
    );
  }

  function randomSessionId(): string {
    const randomPart = () => (Math.random().toString(36) + '00000').slice(2, 7);
    return randomPart() + randomPart() + randomPart();
  }

  function getWebcontainerSession(): string {
    let session = randomSessionId();
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

  const userDefinedSubdomain = env.EXPO_TUNNEL_SUBDOMAIN;
  if (userDefinedSubdomain && typeof userDefinedSubdomain === 'string') {
    debug('Session:', userDefinedSubdomain);
    return { session: userDefinedSubdomain };
  }
  return { session: getWebcontainerSession() };
}

export async function getExpoAccountTunnelUrlAsync(projectRoot: string): Promise<string | null> {
  async function resolveExpoAccountIdAsync(projectRoot: string): Promise<string | null> {
    const { exp } = getConfig(projectRoot, { skipSDKVersionRequirement: true });
    const easProjectId = exp.extra?.eas?.projectId as string | undefined | null;
    if (easProjectId) {
      try {
        const app = await AppQuery.byIdAsync(easProjectId);
        const appOwnerAccountId = app?.ownerAccount?.id;
        if (appOwnerAccountId) {
          return appOwnerAccountId;
        }
      } catch (error) {
        debug('Failed to resolve owning account from EAS project ID:', error);
      }
    }

    const actor = await getUserAsync();
    if (!actor) {
      return null;
    } else if (actor.__typename === 'User' || actor.__typename === 'SSOUser') {
      const actorPrimaryAccountId = actor.primaryAccount?.id;
      if (actorPrimaryAccountId) {
        return actorPrimaryAccountId;
      }
    }

    // Robots have no primary account; fall back to their first available account.
    return actor.accounts[0]?.id ?? null;
  }

  try {
    const accountId = await resolveExpoAccountIdAsync(projectRoot);
    if (!accountId) {
      debug('No Expo account available to create a signed tunnel URL; user is likely logged out.');
      return null;
    }
    const { url } = await TunnelMutation.createSignedTunnelUrlAsync(accountId);
    debug('Created signed tunnel URL for account:', accountId);
    return url;
  } catch (error) {
    debug('Failed to create a signed tunnel URL:', error);
    return null;
  }
}
