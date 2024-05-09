import { ViewProps } from 'react-native';

import type { VideoPlayer } from './VideoPlayer.types';

/**
 * Describes how a video should be scaled to fit in a container.
 * - `contain`: The video maintains its aspect ratio and fits inside the container, with possible letterboxing/pillarboxing.
 * - `cover`: The video maintains its aspect ratio and covers the entire container, potentially cropping some portions.
 * - `fill`: The video stretches/squeezes to completely fill the container, potentially causing distortion.
 */
export type VideoContentFit = 'contain' | 'cover' | 'fill';

export interface VideoViewProps extends ViewProps {
  /**
   * A player instance – use `useVideoPlayer()` to create one.
   */
  player: VideoPlayer;

  /**
   * Determines whether native controls should be displayed or not.
   * @default true
   */
  nativeControls?: boolean;

  /**
   * Describes how the video should be scaled to fit in the container.
   * Options are 'contain', 'cover', and 'fill'.
   * @default 'contain'
   */
  contentFit?: VideoContentFit;

  /**
   * Determines whether fullscreen mode is allowed or not.
   * @default true
   */
  allowsFullscreen?: boolean;

  /**
   * Determines whether the timecodes should be displayed or not.
   * @default true
   * @platform ios
   */
  showsTimecodes?: boolean;

  /**
   * Determines whether the player allows the user to skip media content.
   * @default false
   * @platform android
   * @platform ios
   */
  requiresLinearPlayback?: boolean;

  /**
   * Determines the position offset of the video inside the container.
   * @default { dx: 0, dy: 0 }
   * @platform ios
   */
  contentPosition?: { dx?: number; dy?: number };

  /**
   * A callback to call after the video player enters Picture in Picture (PiP) mode.
   * @platform android
   * @platform ios 14+
   */
  onPictureInPictureStart?: () => void;

  /**
   * A callback to call after the video player exits Picture in Picture (PiP) mode.
   * @platform android
   * @platform ios 14+
   */
  onPictureInPictureStop?: () => void;

  /**
   * Determines whether the player allows Picture in Picture (PiP) mode.
   * @default false
   * @platform ios 14+
   */
  allowsPictureInPicture?: boolean;

  /**
   * Determines whether the player should start Picture in Picture (PiP) automatically when the app is in the background.
   * > **Note:** Only one player can be in Picture in Picture (PiP) mode at a time.
   * @default false
   * @platform android 12+
   * @platform ios 14.2+
   */
  startsPictureInPictureAutomatically?: boolean;
}
