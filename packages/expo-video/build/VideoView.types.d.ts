import { VideoPlayer } from './VideoPlayer';
type VideoContentFit = 'contain' | 'cover' | 'fill';
export type VideoViewProps = {
    player: VideoPlayer;
    nativeControls: boolean | undefined;
    contentFit: VideoContentFit | undefined;
    allowsFullscreen: boolean | undefined;
    showsTimecodes: boolean | undefined;
    requiresLinearPlayback: boolean | undefined;
};
export {};
//# sourceMappingURL=VideoView.types.d.ts.map