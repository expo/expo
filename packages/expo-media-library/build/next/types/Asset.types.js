export var MediaType;
(function (MediaType) {
    MediaType["UNKNOWN"] = "unknown";
    MediaType["IMAGE"] = "image";
    MediaType["AUDIO"] = "audio";
    MediaType["VIDEO"] = "video";
})(MediaType || (MediaType = {}));
/**
 * Describes specific variations of asset media. Maps to [`PHAssetMediaSubtype`](https://developer.apple.com/documentation/photokit/phassetmediasubtype).
 * @platform ios
 */
export var MediaSubtype;
(function (MediaSubtype) {
    MediaSubtype["DEPTH_EFFECT"] = "depthEffect";
    MediaSubtype["HDR"] = "hdr";
    MediaSubtype["HIGH_FRAME_RATE"] = "highFrameRate";
    MediaSubtype["LIVE_PHOTO"] = "livePhoto";
    MediaSubtype["PANORAMA"] = "panorama";
    MediaSubtype["SCREENSHOT"] = "screenshot";
    MediaSubtype["STREAM"] = "stream";
    MediaSubtype["TIME_LAPSE"] = "timelapse";
    MediaSubtype["SPATIAL_MEDIA"] = "spatialMedia";
    MediaSubtype["VIDEO_CINEMATIC"] = "videoCinematic";
})(MediaSubtype || (MediaSubtype = {}));
//# sourceMappingURL=Asset.types.js.map