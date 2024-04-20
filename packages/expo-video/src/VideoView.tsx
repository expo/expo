import { useReleasingSharedObject } from 'expo-modules-core';
import { ReactNode, PureComponent, createRef } from 'react';

import NativeVideoModule from './NativeVideoModule';
import NativeVideoView from './NativeVideoView';
import { VideoPlayer, VideoSource, VideoViewProps } from './VideoView.types';

/**
 * Creates a `VideoPlayer`, which will be automatically cleaned up when the component is unmounted.
 * @param source - A video source that is used to initialize the player.
 * @param setup - A function that allows setting up the player. It will run after the player is created.
 */
export function useVideoPlayer(
  source: VideoSource,
  setup?: (player: VideoPlayer) => void
): VideoPlayer {
  const parsedSource = typeof source === 'string' ? { uri: source } : source;

  return useReleasingSharedObject(() => {
    const player = new NativeVideoModule.VideoPlayer(parsedSource);
    setup?.(player);
    return player;
  }, [JSON.stringify(parsedSource)]);
}

/**
 * Returns whether the current device supports Picture in Picture (PiP) mode.
 * @returns A `boolean` which is `true` if the device supports PiP mode, and `false` otherwise.
 * @platform android
 * @platform ios
 */
export function isPictureInPictureSupported(): Promise<boolean> {
  return NativeVideoModule.isPictureInPictureSupported();
}

export class VideoView extends PureComponent<VideoViewProps> {
  nativeRef = createRef<any>();

  /**
   * Enters fullscreen mode.
   */
  enterFullscreen() {
    this.nativeRef.current?.enterFullscreen();
  }

  /**
   * Exits fullscreen mode.
   */
  exitFullscreen() {
    this.nativeRef.current?.exitFullscreen();
  }

  /**
   * Enters Picture in Picture (PiP) mode. Throws an exception if the device does not support PiP.
   * > **Note:** Only one player can be in Picture in Picture (PiP) mode at a time.
   * @platform android
   * @platform ios 14+
   */
  startPictureInPicture(): void {
    return this.nativeRef.current?.startPictureInPicture();
  }

  /**
   * Exits Picture in Picture (PiP) mode.
   * @platform android
   * @platform ios 14+
   */
  stopPictureInPicture(): void {
    return this.nativeRef.current?.stopPictureInPicture();
  }

  render(): ReactNode {
    const { player, ...props } = this.props;
    const playerId = getPlayerId(player);

    return <NativeVideoView {...props} player={playerId} ref={this.nativeRef} />;
  }
}

// Temporary solution to pass the shared object ID instead of the player object.
// We can't really pass it as an object in the old architecture.
// Technically we can in the new architecture, but it's not possible yet.
function getPlayerId(player: number | VideoPlayer): number | null {
  if (player instanceof NativeVideoModule.VideoPlayer) {
    // @ts-expect-error
    return player.__expo_shared_object_id__;
  }
  if (typeof player === 'number') {
    return player;
  }
  return null;
}
