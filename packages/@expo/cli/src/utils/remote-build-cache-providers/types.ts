import { Platform } from '@expo/config';

import { type Options as AndroidRunOptions } from '../../run/android/resolveOptions';
import { type Options as IosRunOptions } from '../../run/ios/XcodeBuild.types';

export type RunOptions = AndroidRunOptions | IosRunOptions;

export type ResolveRemoteBuildCacheProps = {
  projectRoot: string;
  platform: Omit<Platform, 'web'>;
  runOptions: RunOptions;
  fingerprintHash: string;
};
export type UploadRemoteBuildCacheProps = {
  projectRoot: string;
  buildPath: string;
  runOptions: RunOptions;
  fingerprintHash: string;
  platform: Omit<Platform, 'web'>;
};
export type CalculateFingerprintHashProps = {
  projectRoot: string;
  platform: Omit<Platform, 'web'>;
  runOptions: RunOptions;
};

export type RemoteBuildCacheProvider<T = any> = {
  plugin: RemoteBuildCachePlugin<T>;
  options: T;
};

export type RemoteBuildCachePlugin<T = any> = {
  resolveRemoteBuildCache(props: ResolveRemoteBuildCacheProps, options: T): Promise<string | null>;
  uploadRemoteBuildCache(props: UploadRemoteBuildCacheProps, options: T): Promise<string | null>;
  calculateFingerprintHash?: (
    props: CalculateFingerprintHashProps,
    options: T
  ) => Promise<string | null>;
};
