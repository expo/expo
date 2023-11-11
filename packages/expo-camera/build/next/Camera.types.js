import { PermissionStatus, } from 'expo-modules-core';
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
export { PermissionStatus };
//# sourceMappingURL=Camera.types.js.map