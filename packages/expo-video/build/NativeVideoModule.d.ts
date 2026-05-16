import type { VideoPlayer } from './VideoPlayer.types';
import type { VideoPlaylist } from './VideoPlaylist.types';
import type { VideoThumbnail } from './VideoThumbnail';
type ExpoVideoModule = {
    VideoPlayer: typeof VideoPlayer;
    VideoPlaylist?: typeof VideoPlaylist;
    VideoThumbnail: typeof VideoThumbnail;
    isPictureInPictureSupported(): boolean;
    setVideoCacheSizeAsync(sizeBytes: number): Promise<void>;
    clearVideoCacheAsync(): Promise<void>;
    getCurrentVideoCacheSize(): number;
};
declare const _default: ExpoVideoModule;
export default _default;
//# sourceMappingURL=NativeVideoModule.d.ts.map