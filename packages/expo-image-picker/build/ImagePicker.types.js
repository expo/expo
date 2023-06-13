// @needsAudit
export var MediaTypeOptions;
(function (MediaTypeOptions) {
    /**
     * Images and videos.
     */
    MediaTypeOptions["All"] = "All";
    /**
     * Only videos.
     */
    MediaTypeOptions["Videos"] = "Videos";
    /**
     * Only images.
     */
    MediaTypeOptions["Images"] = "Images";
})(MediaTypeOptions || (MediaTypeOptions = {}));
// @needsAudit
export var VideoExportPreset;
(function (VideoExportPreset) {
    /**
     * Resolution: __Unchanged__ •
     * Video compression: __None__ •
     * Audio compression: __None__
     */
    VideoExportPreset[VideoExportPreset["Passthrough"] = 0] = "Passthrough";
    /**
     * Resolution: __Depends on the device__ •
     * Video compression: __H.264__ •
     * Audio compression: __AAC__
     */
    VideoExportPreset[VideoExportPreset["LowQuality"] = 1] = "LowQuality";
    /**
     * Resolution: __Depends on the device__ •
     * Video compression: __H.264__ •
     * Audio compression: __AAC__
     */
    VideoExportPreset[VideoExportPreset["MediumQuality"] = 2] = "MediumQuality";
    /**
     * Resolution: __Depends on the device__ •
     * Video compression: __H.264__ •
     * Audio compression: __AAC__
     */
    VideoExportPreset[VideoExportPreset["HighestQuality"] = 3] = "HighestQuality";
    /**
     * Resolution: __640 × 480__ •
     * Video compression: __H.264__ •
     * Audio compression: __AAC__
     */
    VideoExportPreset[VideoExportPreset["H264_640x480"] = 4] = "H264_640x480";
    /**
     * Resolution: __960 × 540__ •
     * Video compression: __H.264__ •
     * Audio compression: __AAC__
     */
    VideoExportPreset[VideoExportPreset["H264_960x540"] = 5] = "H264_960x540";
    /**
     * Resolution: __1280 × 720__ •
     * Video compression: __H.264__ •
     * Audio compression: __AAC__
     */
    VideoExportPreset[VideoExportPreset["H264_1280x720"] = 6] = "H264_1280x720";
    /**
     * Resolution: __1920 × 1080__ •
     * Video compression: __H.264__ •
     * Audio compression: __AAC__
     */
    VideoExportPreset[VideoExportPreset["H264_1920x1080"] = 7] = "H264_1920x1080";
    /**
     * Resolution: __3840 × 2160__ •
     * Video compression: __H.264__ •
     * Audio compression: __AAC__
     */
    VideoExportPreset[VideoExportPreset["H264_3840x2160"] = 8] = "H264_3840x2160";
    /**
     * Resolution: __1920 × 1080__ •
     * Video compression: __HEVC__ •
     * Audio compression: __AAC__
     */
    VideoExportPreset[VideoExportPreset["HEVC_1920x1080"] = 9] = "HEVC_1920x1080";
    /**
     * Resolution: __3840 × 2160__ •
     * Video compression: __HEVC__ •
     * Audio compression: __AAC__
     */
    VideoExportPreset[VideoExportPreset["HEVC_3840x2160"] = 10] = "HEVC_3840x2160";
})(VideoExportPreset || (VideoExportPreset = {}));
// @needsAudit
export var UIImagePickerControllerQualityType;
(function (UIImagePickerControllerQualityType) {
    /**
     * Highest available resolution.
     */
    UIImagePickerControllerQualityType[UIImagePickerControllerQualityType["High"] = 0] = "High";
    /**
     * Depends on the device.
     */
    UIImagePickerControllerQualityType[UIImagePickerControllerQualityType["Medium"] = 1] = "Medium";
    /**
     * Depends on the device.
     */
    UIImagePickerControllerQualityType[UIImagePickerControllerQualityType["Low"] = 2] = "Low";
    /**
     * 640 × 480
     */
    UIImagePickerControllerQualityType[UIImagePickerControllerQualityType["VGA640x480"] = 3] = "VGA640x480";
    /**
     * 1280 × 720
     */
    UIImagePickerControllerQualityType[UIImagePickerControllerQualityType["IFrame1280x720"] = 4] = "IFrame1280x720";
    /**
     * 960 × 540
     */
    UIImagePickerControllerQualityType[UIImagePickerControllerQualityType["IFrame960x540"] = 5] = "IFrame960x540";
})(UIImagePickerControllerQualityType || (UIImagePickerControllerQualityType = {}));
/**
 * Picker presentation style. Its values are directly mapped to the [`UIModalPresentationStyle`](https://developer.apple.com/documentation/uikit/uiviewcontroller/1621355-modalpresentationstyle).
 *
 * @platform ios
 */
export var UIImagePickerPresentationStyle;
(function (UIImagePickerPresentationStyle) {
    /**
     * A presentation style in which the presented picker covers the screen.
     */
    UIImagePickerPresentationStyle["FULL_SCREEN"] = "fullScreen";
    /**
     * A presentation style that partially covers the underlying content.
     */
    UIImagePickerPresentationStyle["PAGE_SHEET"] = "pageSheet";
    /**
     * A presentation style that displays the picker centered in the screen.
     */
    UIImagePickerPresentationStyle["FORM_SHEET"] = "formSheet";
    /**
     * A presentation style where the picker is displayed over the app's content.
     */
    UIImagePickerPresentationStyle["CURRENT_CONTEXT"] = "currentContext";
    /**
     * A presentation style in which the picker view covers the screen.
     */
    UIImagePickerPresentationStyle["OVER_FULL_SCREEN"] = "overFullScreen";
    /**
     * A presentation style where the picker is displayed over the app's content.
     */
    UIImagePickerPresentationStyle["OVER_CURRENT_CONTEXT"] = "overCurrentContext";
    /**
     * A presentation style where the picker is displayed in a popover view.
     */
    UIImagePickerPresentationStyle["POPOVER"] = "popover";
    /**
     * The default presentation style chosen by the system.
     * On older iOS versions, falls back to `WebBrowserPresentationStyle.FullScreen`.
     *
     * @platform ios 13+
     */
    UIImagePickerPresentationStyle["AUTOMATIC"] = "automatic";
})(UIImagePickerPresentationStyle || (UIImagePickerPresentationStyle = {}));
/**
 * Picker preferred asset representation mode. Its values are directly mapped to the [`PHPickerConfigurationAssetRepresentationMode`](https://developer.apple.com/documentation/photokit/phpickerconfigurationassetrepresentationmode).
 *
 * @platform ios
 */
export var UIImagePickerPreferredAssetRepresentationMode;
(function (UIImagePickerPreferredAssetRepresentationMode) {
    /**
     * A mode that indicates that the system chooses the appropriate asset representation.
     */
    UIImagePickerPreferredAssetRepresentationMode["Automatic"] = "automatic";
    /**
     * A mode that uses the most compatible asset representation.
     */
    UIImagePickerPreferredAssetRepresentationMode["Compatible"] = "compatible";
    /**
     * A mode that uses the current representation to avoid transcoding, if possible.
     */
    UIImagePickerPreferredAssetRepresentationMode["Current"] = "current";
})(UIImagePickerPreferredAssetRepresentationMode || (UIImagePickerPreferredAssetRepresentationMode = {}));
export var CameraType;
(function (CameraType) {
    /**
     * Back/rear camera.
     */
    CameraType["back"] = "back";
    /**
     * Front camera
     */
    CameraType["front"] = "front";
})(CameraType || (CameraType = {}));
//# sourceMappingURL=ImagePicker.types.js.map