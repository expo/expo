import { ReactNode, PureComponent } from 'react';
import type { VideoViewProps } from './VideoView.types';
export declare class VideoView extends PureComponent<VideoViewProps> {
    nativeRef: import("react").RefObject<any>;
    /**
     * Enters fullscreen mode.
     */
    enterFullscreen(): void;
    /**
     * Exits fullscreen mode.
     */
    exitFullscreen(): void;
    /**
     * Enters Picture in Picture (PiP) mode. Throws an exception if the device does not support PiP.
     * > **Note:** Only one player can be in Picture in Picture (PiP) mode at a time.
     *
     * > **Note:** The `supportsPictureInPicture` property of the [config plugin](#configuration-in-app-config)
     * > has to be configured for the PiP to work.
     * @platform android
     * @platform ios
     */
    startPictureInPicture(): void;
    /**
     * Exits Picture in Picture (PiP) mode.
     * @platform android
     * @platform ios
     */
    stopPictureInPicture(): void;
    render(): ReactNode;
}
//# sourceMappingURL=VideoView.d.ts.map