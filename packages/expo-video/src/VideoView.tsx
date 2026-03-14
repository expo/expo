import { ReactNode, PureComponent, createRef } from 'react';

import NativeVideoModule from './NativeVideoModule';
import NativeVideoView, { NativeTextureVideoView } from './NativeVideoView';
import type { VideoPlayer } from './VideoPlayer.types';
import type { VideoViewProps } from './VideoView.types';

/**
 * Returns whether the current device supports Picture in Picture (PiP) mode.
 *
 * > **Note:** All major web browsers support Picture in Picture (PiP) mode except Firefox.
 * > For more information, see [MDN web docs](https://developer.mozilla.org/en-US/docs/Web/API/Picture-in-Picture_API#browser_compatibility).
 * @returns A `boolean` which is `true` if the device supports PiP mode, and `false` otherwise.
 * @platform android
 * @platform ios
 * @platform web
 */
export function isPictureInPictureSupported(): boolean {
  return NativeVideoModule.isPictureInPictureSupported();
}

export class VideoView extends PureComponent<VideoViewProps> {
  /**
   * A reference to the underlying native view. On web it is a reference to the HTMLVideoElement.
   */
  nativeRef = createRef<any>();

  /**
   * Enters fullscreen mode.
   */
  async enterFullscreen(): Promise<void> {
    return await this.nativeRef.current?.enterFullscreen();
  }

  /**
    * Exits fullscreen mode.
    *
    * > **Note:** On Android the JS runtime is paused when the `VideoView` is in fullscreen mode. Because of this `exitFullscreen` will only work when called from a native listener - see the example below.
    *
    * @example
    * ```tsx
    *   const ref = useRef<VideoView>()
    *   const player = useVideoPlayer(source)
    *
    *   // This will work on all platforms
    *   useEventListener(player, 'playToEnd', () => {
    *     ref.current?.exitFullscreen();
    *   });
    *
    *   // This will not work on Android
    *   const enterAndExit = useCallback(() => {
    *     setTimeout(() => {
    *       ref.current?.exitFullscreen()
    *     }, 5000)
    *     ref.current?.enterFullscreen()
    *   },[])
    * ```
    */
  async exitFullscreen(): Promise<void> {
    return await this.nativeRef.current?.exitFullscreen();
  }

  /**
   * Enters Picture in Picture (PiP) mode. Throws an exception if the device does not support PiP.
   * > **Note:** Only one player can be in Picture in Picture (PiP) mode at a time.
   *
   * > **Note:** The `supportsPictureInPicture` property of the [config plugin](#configuration-in-app-config)
   * > has to be configured for the PiP to work.
   * @platform android
   * @platform ios
   * @platform web
   */
  async startPictureInPicture(): Promise<void> {
    return await this.nativeRef.current?.startPictureInPicture();
  }

  /**
   * Exits Picture in Picture (PiP) mode.
   * @platform android
   * @platform ios
   * @platform web
   */
  async stopPictureInPicture(): Promise<void> {
    return await this.nativeRef.current?.stopPictureInPicture();
  }

  render(): ReactNode {
    const { player, ...props } = this.props;
    const playerId = player ? getPlayerId(player) : null;

    if (NativeTextureVideoView && this.props.surfaceType === 'textureView') {
      return <NativeTextureVideoView {...props} player={playerId} ref={this.nativeRef} />;
    }
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
