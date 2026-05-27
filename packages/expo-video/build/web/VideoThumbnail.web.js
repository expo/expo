import { SharedRef } from 'expo';
export default class VideoThumbnailWeb extends SharedRef {
    nativeRefType = 'image';
    uri = null;
    width = 0;
    height = 0;
    requestedTime = 0;
    actualTime = 0;
    static init({ uri, width, height, requestedTime, actualTime, }) {
        return Object.assign(new VideoThumbnailWeb(), {
            uri,
            width,
            height,
            requestedTime,
            actualTime,
        });
    }
}
//# sourceMappingURL=VideoThumbnail.web.js.map