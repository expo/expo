import { ReactNode, PureComponent, useMemo, createRef } from 'react';

import NativeVideoModule from './NativeVideoModule';
import NativeVideoView from './NativeVideoView';
import { VideoPlayer, VideoSource, VideoViewProps } from './VideoView.types';

export function useVideoPlayer(source: VideoSource): VideoPlayer {
  return useMemo(() => {
    if (typeof source === 'string') {
      return new NativeVideoModule.VideoPlayer({
        uri: source,
      });
    }
    return new NativeVideoModule.VideoPlayer(source);
  }, []);
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

  replace(source: VideoSource) {
    if (typeof source === 'string') {
      this.nativeRef.current?.replace({ uri: source });
      return;
    }
    this.nativeRef.current?.replace(source);
  }

  enterFullscreen() {
    this.nativeRef.current?.enterFullscreen();
  }

  exitFullscreen() {
    this.nativeRef.current?.exitFullscreen();
  }

  /**
   * Enters Picture in Picture (PiP) mode. Throws an exception if the device does not support PiP.
   * > **Note:** Only one player can be in Picture in Picture (PiP) mode at a time.
   * @platform android
   * @platform ios 14+
   */
  startPictureInPicture() {
    return this.nativeRef.current?.startPictureInPicture();
  }

  /**
   * Exits Picture in Picture (PiP) mode.
   * @platform android
   * @platform ios 14+
   */
  stopPictureInPicture() {
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
