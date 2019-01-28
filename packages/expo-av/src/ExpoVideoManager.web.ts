import ExponentAV from './ExponentAV';
import { PlaybackStatus } from './AV';

export default {
  get name(): string {
    return 'ExpoVideoManager';
  },
  get ScaleNone(): string {
    return 'none';
  },
  get ScaleToFill(): string {
    return 'fill';
  },
  get ScaleAspectFit(): string {
    return 'contain';
  },
  get ScaleAspectFill(): string {
    return 'cover';
  },

  async setFullscreen(
    element: HTMLMediaElement,
    isFullScreenEnabled: boolean
  ): Promise<PlaybackStatus> {
    if (isFullScreenEnabled) {
      await element.requestFullscreen();
    } else {
      await document.exitFullscreen();
    }
    return ExponentAV.getStatusForVideo(element);
  },
};
