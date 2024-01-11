import { ReactNode, PureComponent } from 'react';
import { VideoPlayer, VideoViewProps } from './VideoView.types';
export declare function useVideoPlayer(source?: string | null): VideoPlayer;
export declare class VideoView extends PureComponent<VideoViewProps> {
    nativeRef: any;
    enterFullscreen(): void;
    exitFullscreen(): void;
    /**
     * Returns whether the current device supports Picture in Picture (PiP) mode.
     * @returns A Promise that fulfills to `true` if the device supports PiP mode, and `false` otherwise.
     * @platform android, ios
     */
    isPictureInPictureSupportedAsync(): Promise<boolean>;
    /**
     * Enters Picture in Picture (PiP) mode. Throws an exception if the device does not support PiP.
     * > **Note:** Only one player can be in Picture in Picture (PiP) mode at a time.
     * @platform android, ios 14+
     */
    startPictureInPicture(): any;
    /**
     * Exits Picture in Picture (PiP) mode.
     * @platform android, ios 14+
     */
    stopPictureInPicture(): any;
    render(): ReactNode;
}
//# sourceMappingURL=VideoView.d.ts.map