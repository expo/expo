import type { ExpoJsTransformerConfigExtensions } from '@expo/metro-config';
import type { ConfigT } from '@expo/metro/metro-config';

/** Metro's hydrated configuration, plus the fields Expo adds. */
export type ExpoMetroConfig = Omit<ConfigT, 'resolver' | 'transformer'> & {
  resolver: ConfigT['resolver'] & {
    unstable_onDemandFilesystem?: boolean | 'UNSTABLE_ALLOW_ALL';
  };
  transformer: ConfigT['transformer'] & ExpoJsTransformerConfigExtensions;
};
