import { PermissionStatus, } from 'unimodules-permissions-interface';
export var CameraType;
(function (CameraType) {
    /**
     * @platforms ios, android, web
     */
    CameraType["front"] = "front";
    /**
     * @platforms ios, android, web
     */
    CameraType["back"] = "back";
})(CameraType || (CameraType = {}));
export var FlashMode;
(function (FlashMode) {
    /**
     * @platforms ios, android, web
     */
    FlashMode["on"] = "on";
    /**
     * @platforms ios, android, web
     */
    FlashMode["off"] = "off";
    /**
     * @platforms ios, android, web
     */
    FlashMode["auto"] = "auto";
    /**
     * @platforms ios, android, web
     */
    FlashMode["torch"] = "torch";
})(FlashMode || (FlashMode = {}));
export var AutoFocus;
(function (AutoFocus) {
    /**
     * @platforms ios, android, web
     */
    AutoFocus["on"] = "on";
    /**
     * @platforms ios, android, web
     */
    AutoFocus["off"] = "off";
    /**
     * @platforms web
     */
    AutoFocus["auto"] = "auto";
    /**
     * @platforms web
     */
    AutoFocus["singleShot"] = "singleShot";
})(AutoFocus || (AutoFocus = {}));
export var WhiteBalance;
(function (WhiteBalance) {
    /**
     * @platforms ios, android, web
     */
    WhiteBalance["auto"] = "auto";
    /**
     * @platforms ios, android
     */
    WhiteBalance["sunny"] = "sunny";
    /**
     * @platforms ios, android
     */
    WhiteBalance["cloudy"] = "cloudy";
    /**
     * @platforms ios, android
     */
    WhiteBalance["shadow"] = "shadow";
    /**
     * @platforms ios, android
     */
    WhiteBalance["incandescent"] = "incandescent";
    /**
     * @platforms ios, android
     */
    WhiteBalance["fluorescent"] = "fluorescent";
    /**
     * @platforms web
     */
    WhiteBalance["continuous"] = "continuous";
    /**
     * @platforms web
     */
    WhiteBalance["manual"] = "manual";
})(WhiteBalance || (WhiteBalance = {}));
export var ImageType;
(function (ImageType) {
    ImageType["png"] = "png";
    ImageType["jpg"] = "jpg";
})(ImageType || (ImageType = {}));
export { PermissionStatus };
//# sourceMappingURL=Camera.types.js.map