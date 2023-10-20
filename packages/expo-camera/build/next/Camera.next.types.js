import { PermissionStatus, } from 'expo-modules-core';
export var CameraType;
(function (CameraType) {
    CameraType["front"] = "front";
    CameraType["back"] = "back";
})(CameraType || (CameraType = {}));
export var FlashMode;
(function (FlashMode) {
    FlashMode["on"] = "on";
    FlashMode["off"] = "off";
    FlashMode["auto"] = "auto";
})(FlashMode || (FlashMode = {}));
export var ImageType;
(function (ImageType) {
    ImageType["png"] = "png";
    ImageType["jpg"] = "jpg";
})(ImageType || (ImageType = {}));
/**
 * This option specifies what codec to use when recording a video.
 * @platform ios
 */
export var VideoCodec;
(function (VideoCodec) {
    VideoCodec["H264"] = "avc1";
    VideoCodec["HEVC"] = "hvc1";
    VideoCodec["JPEG"] = "jpeg";
    VideoCodec["AppleProRes422"] = "apcn";
    VideoCodec["AppleProRes4444"] = "ap4h";
})(VideoCodec || (VideoCodec = {}));
/**
 * This option specifies the stabilization mode to use when recording a video.
 * @platform ios
 */
export var VideoStabilization;
(function (VideoStabilization) {
    VideoStabilization["off"] = "off";
    VideoStabilization["standard"] = "standard";
    VideoStabilization["cinematic"] = "cinematic";
    VideoStabilization["auto"] = "auto";
})(VideoStabilization || (VideoStabilization = {}));
// @docsMissing
export var VideoQuality;
(function (VideoQuality) {
    VideoQuality["2160p"] = "2160p";
    VideoQuality["1080p"] = "1080p";
    VideoQuality["720p"] = "720p";
    VideoQuality["480p"] = "480p";
    VideoQuality["4:3"] = "4:3";
})(VideoQuality || (VideoQuality = {}));
export var CameraOrientation;
(function (CameraOrientation) {
    CameraOrientation[CameraOrientation["portrait"] = 1] = "portrait";
    CameraOrientation[CameraOrientation["portraitUpsideDown"] = 2] = "portraitUpsideDown";
    CameraOrientation[CameraOrientation["landscapeLeft"] = 3] = "landscapeLeft";
    CameraOrientation[CameraOrientation["landscapeRight"] = 4] = "landscapeRight";
})(CameraOrientation || (CameraOrientation = {}));
export { PermissionStatus };
//# sourceMappingURL=Camera.next.types.js.map