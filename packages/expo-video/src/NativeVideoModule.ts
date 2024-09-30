import { requireNativeModule } from 'expo-modules-core';

import type { VideoPlayer } from './VideoPlayer.types';
import type { VideoThumbnail } from './VideoThumbnail';

type ExpoVideoModule = {
  VideoPlayer: typeof VideoPlayer;
  VideoThumbnail: typeof VideoThumbnail;

  isPictureInPictureSupported(): boolean;
  setVideoCacheSizeAsync(sizeBytes: number): Promise<void>;
  cleanVideoCacheAsync(): Promise<void>;
  getCurrentVideoCacheSize(): number;
};

export default requireNativeModule<ExpoVideoModule>('ExpoVideo');
