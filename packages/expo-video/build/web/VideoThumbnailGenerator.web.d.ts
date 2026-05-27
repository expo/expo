import type { VideoThumbnailOptions } from '../VideoPlayer.types';
import VideoThumbnailWeb from './VideoThumbnail.web';
type ThumbnailSource = {
    uri: string;
    headers?: Record<string, string>;
};
export declare function generateVideoThumbnailsAsync(source: ThumbnailSource, times: number | number[], options?: VideoThumbnailOptions): Promise<VideoThumbnailWeb[]>;
export {};
//# sourceMappingURL=VideoThumbnailGenerator.web.d.ts.map