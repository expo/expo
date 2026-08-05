import type { ExpoConfig } from '@expo/config';
import { getConfig } from '@expo/config';

import { getSession } from '../../api/user/UserSettings';
import { env } from '../../utils/env';

export class Bonjour {
  private stopAdvertising?: () => Promise<void>;

  constructor(
    /** Project root directory */
    private projectRoot: string,
    /** Port to advertise, if any */
    private port: number | undefined
  ) {}

  public async announceAsync({
    exp = getConfig(this.projectRoot).exp,
    username = getSession()?.username,
  }: {
    exp?: ExpoConfig;
    username?: string;
  }): Promise<void> {
    if (env.CI || !env.EXPO_UNSTABLE_BONJOUR) {
      return;
    } else if (!this.port) {
      return;
    }

    const dnssd: typeof import('dnssd-advertise') = await import('dnssd-advertise');
    if (this.stopAdvertising) {
      await this.stopAdvertising();
    }

    this.stopAdvertising = dnssd.advertise({
      name: `${exp.name}`,
      type: 'expo',
      protocol: 'tcp',
      hostname: exp.slug,
      port: this.port,
      stack: 'IPv4',
      txt: {
        name: exp.name?.slice(0, 255),
        slug: exp.slug?.slice(0, 255),
        androidPackage: exp.android?.package?.slice(0, 255),
        iosBundleIdentifier: exp.ios?.bundleIdentifier?.slice(0, 255),
        username: username?.slice(0, 255),
      },
    });
  }

  public async closeAsync(): Promise<boolean> {
    if (!this.stopAdvertising) {
      return false;
    } else {
      await this.stopAdvertising?.();
      this.stopAdvertising = undefined;
      return true;
    }
  }
}
