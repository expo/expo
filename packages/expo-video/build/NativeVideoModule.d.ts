import type { VideoPlayer } from './VideoPlayer.types';
import type { VideoThumbnail } from './VideoThumbnail';
type ExpoVideoModule = {
    VideoPlayer: typeof VideoPlayer;
    VideoThumbnail: typeof VideoThumbnail;
    isPictureInPictureSupported(): boolean;
};
declare const _default: ExpoVideoModule;
export default _default;
//# sourceMappingURL=NativeVideoModule.d.ts.map