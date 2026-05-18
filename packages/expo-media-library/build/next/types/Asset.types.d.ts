export declare enum MediaType {
    UNKNOWN = "unknown",
    IMAGE = "image",
    AUDIO = "audio",
    VIDEO = "video"
}
/**
 * Describes specific variations of asset media. Maps to [`PHAssetMediaSubtype`](https://developer.apple.com/documentation/photokit/phassetmediasubtype).
 * @platform ios
 */
export declare enum MediaSubtype {
    DEPTH_EFFECT = "depthEffect",
    HDR = "hdr",
    HIGH_FRAME_RATE = "highFrameRate",
    LIVE_PHOTO = "livePhoto",
    PANORAMA = "panorama",
    SCREENSHOT = "screenshot",
    STREAM = "stream",
    TIME_LAPSE = "timelapse",
    SPATIAL_MEDIA = "spatialMedia",
    VIDEO_CINEMATIC = "videoCinematic"
}
export type Location = {
    latitude: number;
    longitude: number;
};
export type Shape = {
    width: number;
    height: number;
};
export type AssetInfo = {
    id: string;
    filename: string;
    uri: string;
    mediaType: MediaType;
    width: number;
    height: number;
    duration: number | null;
    creationTime: number | null;
    modificationTime: number | null;
    isFavorite?: boolean;
};
/**
 * Lightweight metadata for a single asset, returned by [`Query.exeForMetadata`](#exeformetadata).
 *
 * Contains fields that can be read cheaply from the media store, without resolving file paths or
 * decoding files. Use [`Asset`](#asset) getters when you need heavier fields such as URI or EXIF data.
 *
 * > On Android, `width` and `height` may be `null` when the media store does not record them.
 */
export type AssetMetadata = {
    id: string;
    filename: string | null;
    mediaType: MediaType;
    width: number | null;
    height: number | null;
    duration: number | null;
    creationTime: number | null;
    modificationTime: number | null;
    isFavorite: boolean;
};
//# sourceMappingURL=Asset.types.d.ts.map