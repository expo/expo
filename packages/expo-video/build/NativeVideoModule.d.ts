import type { VideoPlayer } from './VideoPlayer.types';
type ExpoVideoModule = {
    VideoPlayer: typeof VideoPlayer;
    isPictureInPictureSupported(): boolean;
    setVideoCacheSizeAsync(sizeBytes: number): Promise<void>;
    cleanVideoCacheAsync(): Promise<void>;
    getCurrentVideoCacheSize(): number;
};
declare const _default: ExpoVideoModule;
export default _default;
//# sourceMappingURL=NativeVideoModule.d.ts.map