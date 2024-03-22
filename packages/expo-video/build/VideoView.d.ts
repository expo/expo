import { ReactNode, PureComponent } from 'react';
import { VideoPlayer, VideoSource, VideoViewProps } from './VideoView.types';
export declare function useVideoPlayer(source: VideoSource): VideoPlayer;
/**
 * Returns whether the current device supports Picture in Picture (PiP) mode.
 * @returns A `boolean` which is `true` if the device supports PiP mode, and `false` otherwise.
 * @platform android
 * @platform ios
 */
export declare function isPictureInPictureSupported(): Promise<boolean>;
export declare class VideoView extends PureComponent<VideoViewProps> {
    nativeRef: import("react").RefObject<any>;
    replace(source: VideoSource): void;
    enterFullscreen(): void;
    exitFullscreen(): void;
    /**
     * Enters Picture in Picture (PiP) mode. Throws an exception if the device does not support PiP.
     * > **Note:** Only one player can be in Picture in Picture (PiP) mode at a time.
     * @platform android
     * @platform ios 14+
     */
    startPictureInPicture(): any;
    /**
     * Exits Picture in Picture (PiP) mode.
     * @platform android
     * @platform ios 14+
     */
    stopPictureInPicture(): any;
    render(): ReactNode;
}
//# sourceMappingURL=VideoView.d.ts.map