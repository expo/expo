import { ReactNode, PureComponent } from 'react';
import { VideoPlayer, VideoViewProps } from './VideoView.types';
export declare function useVideoPlayer(source?: string | null): VideoPlayer;
export declare class VideoView extends PureComponent<VideoViewProps> {
    nativeRef: import("react").RefObject<any>;
    enterFullscreen(): void;
    exitFullscreen(): void;
    render(): ReactNode;
}
//# sourceMappingURL=VideoView.d.ts.map