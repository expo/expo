import { requireNativeModule } from 'expo-modules-core';

import type { VideoPlayer } from './VideoPlayer.types';

type ExpoVideoModule = {
  VideoPlayer: typeof VideoPlayer;
  isPictureInPictureSupported(): boolean;
  cleanVideoCache(): void;
  cleanAllVideoCache(): void;
};

export default requireNativeModule<ExpoVideoModule>('ExpoVideo');
