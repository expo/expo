import { ExpoConfig, getConfig } from '@expo/config';

import { env } from '../../utils/env';

const debug = require('debug')('expo:start:server:bonjour') as typeof console.log;

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
  }: {
    exp?: Pick<ExpoConfig, 'name' | 'description' | 'slug' | 'primaryColor'>;
  }) {
    if (env.CI || !env.EXPO_UNSTABLE_BONJOUR) {
      return;
    } else if (!this.port) {
      return;
    }

    const dnssd: typeof import('dnssd-advertise') = await import('dnssd-advertise');
    if (this.stopAdvertising) {
      await this.stopAdvertising();
    }

    debug('Started Bonjour service');
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
      },
    });
  }

  public async closeAsync(): Promise<boolean> {
    if (!this.stopAdvertising) {
      return false;
    } else {
      debug('Stopped Bonjour service');
      await this.stopAdvertising?.();
      this.stopAdvertising = undefined;
      return true;
    }
  }
}
