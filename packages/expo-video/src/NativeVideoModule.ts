import { requireNativeModule } from 'expo';

import type { VideoPlayer } from './VideoPlayer.types';
import type { VideoThumbnail } from './VideoThumbnail';

type ExpoVideoModule = {
  VideoPlayer: typeof VideoPlayer;
  VideoThumbnail: typeof VideoThumbnail;

  isPictureInPictureSupported(): boolean;
  setVideoCacheSizeAsync(sizeBytes: number): Promise<void>;
  clearVideoCacheAsync(): Promise<void>;
  getCurrentVideoCacheSize(): number;
  setIsAudioActiveAsync(active: boolean): Promise<void>;
};

export default requireNativeModule<ExpoVideoModule>('ExpoVideo');
