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
// @docsMissing
export var UIImagePickerPresentationStyle;
(function (UIImagePickerPresentationStyle) {
    UIImagePickerPresentationStyle[UIImagePickerPresentationStyle["FullScreen"] = 0] = "FullScreen";
    UIImagePickerPresentationStyle[UIImagePickerPresentationStyle["PageSheet"] = 1] = "PageSheet";
    UIImagePickerPresentationStyle[UIImagePickerPresentationStyle["FormSheet"] = 2] = "FormSheet";
    UIImagePickerPresentationStyle[UIImagePickerPresentationStyle["CurrentContext"] = 3] = "CurrentContext";
    UIImagePickerPresentationStyle[UIImagePickerPresentationStyle["OverFullScreen"] = 5] = "OverFullScreen";
    UIImagePickerPresentationStyle[UIImagePickerPresentationStyle["OverCurrentContext"] = 6] = "OverCurrentContext";
    UIImagePickerPresentationStyle[UIImagePickerPresentationStyle["Popover"] = 7] = "Popover";
    UIImagePickerPresentationStyle[UIImagePickerPresentationStyle["BlurOverFullScreen"] = 8] = "BlurOverFullScreen";
    UIImagePickerPresentationStyle[UIImagePickerPresentationStyle["Automatic"] = -2] = "Automatic";
})(UIImagePickerPresentationStyle || (UIImagePickerPresentationStyle = {}));
//# sourceMappingURL=ImagePicker.types.js.map