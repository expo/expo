import { SharedRef } from 'expo';
type VideoThumbnailInit = {
    uri: string;
    width: number;
    height: number;
    requestedTime: number;
    actualTime: number;
};
export default class VideoThumbnailWeb extends SharedRef<'image'> {
    nativeRefType: string;
    uri: string | null;
    width: number;
    height: number;
    requestedTime: number;
    actualTime: number;
    static init({ uri, width, height, requestedTime, actualTime, }: VideoThumbnailInit): VideoThumbnailWeb;
}
export {};
//# sourceMappingURL=VideoThumbnail.web.d.ts.map