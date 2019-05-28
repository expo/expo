/**
 * Quality of recorded video.
 */
export var VideoQuality;
(function (VideoQuality) {
    /**
     * `2160p`
     */
    VideoQuality["VQ_2160p"] = "2160p";
    /**
     * `1080p`
     */
    VideoQuality["VQ_1080p"] = "1080p";
    /**
     * `720p`
     */
    VideoQuality["VQ_720p"] = "720p";
    /**
     * `480p`
     */
    VideoQuality["VQ_480p"] = "480p";
    /**
     * `4:3` resulting in video of size `640x480`.
     * @Android only
     */
    VideoQuality["VQ_4x3"] = "4x3";
})(VideoQuality || (VideoQuality = {}));
/**
 * Camera facing mapped into camera sensor being used.
 */
export var Facing;
(function (Facing) {
    /**
     * Front-facing camera sensor.
     */
    Facing["Front"] = "front";
    /**
     * Back-facing camera sensor.
     */
    Facing["Back"] = "back";
})(Facing || (Facing = {}));
/**
 * Camera flash mode.
 */
export var FlashMode;
(function (FlashMode) {
    /**
     * Device would flash during taking picture.
     */
    FlashMode["On"] = "on";
    /**
     * No flash.
     */
    FlashMode["Off"] = "off";
    /**
     * Flash would be fired automatically if required.
     */
    FlashMode["Auto"] = "auto";
    /**
     * Constantly turned on flash.
     */
    FlashMode["Torch"] = "torch";
})(FlashMode || (FlashMode = {}));
/**
 * State of camera autofocus.
 */
export var Autofocus;
(function (Autofocus) {
    /**
     * Autofocus enabled.
     */
    Autofocus["On"] = "on";
    /**
     * Autofocus disabled.
     * Focus would lock as it was in the moment of change,
     * but it can be adjusted on some devices via `focusDepth` prop.
     */
    Autofocus["Off"] = "off";
})(Autofocus || (Autofocus = {}));
/**
 * Camera white balance.
 * If a device does not support any of these values previous one is used.
 */
export var WhiteBalance;
(function (WhiteBalance) {
    /**
     *
     */
    WhiteBalance["Auto"] = "auto";
    /**
     *
     */
    WhiteBalance["Sunny"] = "sunny";
    /**
     *
     */
    WhiteBalance["Cloudy"] = "cloudy";
    /**
     *
     */
    WhiteBalance["Shadow"] = "shadow";
    /**
     *
     */
    WhiteBalance["Flurescent"] = "flurescent";
    /**
     *
     */
    WhiteBalance["Incandescnet"] = "incandescnet";
})(WhiteBalance || (WhiteBalance = {}));
export var HDR;
(function (HDR) {
    /**
     *
     */
    HDR["On"] = "on";
    /**
     *
     */
    HDR["Off"] = "off";
})(HDR || (HDR = {}));
//# sourceMappingURL=ExpoCamera2.types.js.map