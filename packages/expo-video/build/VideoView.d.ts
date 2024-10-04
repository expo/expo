import React from 'react';
import { VideoPlayer } from './VideoPlayer';
export declare function useVideoPlayer(source?: string | null): VideoPlayer;
export declare class VideoView extends React.PureComponent<any> {
    nativeRef: React.RefObject<unknown>;
    enterFullscreen(): void;
    exitFullscreen(): void;
    render(): React.ReactNode;
}
//# sourceMappingURL=VideoView.d.ts.map