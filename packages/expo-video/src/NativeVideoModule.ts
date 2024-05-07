import { requireNativeModule } from 'expo-modules-core';

import type { VideoPlayer } from './VideoPlayer.types';

type ExpoVideoModule = {
  VideoPlayer: typeof VideoPlayer;
  isPictureInPictureSupported(): boolean;
};

export default requireNativeModule<ExpoVideoModule>('ExpoVideo');
