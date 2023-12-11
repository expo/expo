import { ReactNode, PureComponent, useMemo, createRef } from 'react';

import NativeVideoModule from './NativeVideoModule';
import NativeVideoView from './NativeVideoView';
import { VideoPlayer, VideoViewProps } from './VideoView.types';

export function useVideoPlayer(source: string | null = null): VideoPlayer {
  return useMemo(() => {
    return new NativeVideoModule.VideoPlayer(source);
  }, []);
}

export class VideoView extends PureComponent<VideoViewProps> {
  nativeRef = createRef<any>();

  enterFullscreen() {
    this.nativeRef.current?.enterFullscreen();
  }

  exitFullscreen() {
    this.nativeRef.current?.exitFullscreen();
  }

  /**
   * Enters Picture in Picture (PiP) mode. Throws an exception if the device does not support PiP.
   * > **Note:** Only one player can be in Picture in Picture (PiP) mode at a time.
   * @platform ios 14+
   */
  startPictureInPicture() {
    return this.nativeRef.current?.startPictureInPicture();
  }

  /**
   * Exits Picture in Picture (PiP) mode.
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
