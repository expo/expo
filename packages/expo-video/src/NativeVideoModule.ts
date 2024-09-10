import { requireNativeModule } from 'expo-modules-core';

import type { VideoPlayer } from './VideoPlayer.types';

type ExpoVideoModule = {
  VideoPlayer: typeof VideoPlayer;
  isPictureInPictureSupported(): boolean;
  setVideoCacheSizeAsync(sizeBytes: number): Promise<void>;
  cleanVideoCacheAsync(): Promise<void>;
  getCurrentVideoCacheSize(): number;
};

export default requireNativeModule<ExpoVideoModule>('ExpoVideo');
