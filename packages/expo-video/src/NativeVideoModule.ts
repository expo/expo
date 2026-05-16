import { requireNativeModule } from 'expo-modules-core';

import type { VideoPlayer } from './VideoPlayer.types';
import type { VideoPlaylist } from './VideoPlaylist.types';
import type { VideoThumbnail } from './VideoThumbnail';

type ExpoVideoModule = {
  VideoPlayer: typeof VideoPlayer;
  VideoPlaylist?: typeof VideoPlaylist;
  VideoThumbnail: typeof VideoThumbnail;

  isPictureInPictureSupported(): boolean;
  setVideoCacheSizeAsync(sizeBytes: number): Promise<void>;
  clearVideoCacheAsync(): Promise<void>;
  getCurrentVideoCacheSize(): number;
};

export default requireNativeModule<ExpoVideoModule>('ExpoVideo');
