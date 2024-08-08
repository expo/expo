import type { MetroConfig } from '@expo/metro-config';

export type ConfigSet = {
  /** The name of this Metro configuration set, visible when debugging */
  name: string;
  /** The set of config mutations of this plugin */
  config(metroConfig: MetroConfig): void | MetroConfig;
};

export function createConfigSet(
  name: string,
  config: ConfigSet['config'] | Omit<ConfigSet, 'name'>
): ConfigSet {
  if (typeof config === 'object' && 'config' in config) {
    config = config.config;
  }

  return { name, config };
}
