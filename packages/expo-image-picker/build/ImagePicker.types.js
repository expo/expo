import { PermissionStatus } from 'unimodules-permissions-interface';
export const MediaTypeOptions = {
    All: 'All',
    Videos: 'Videos',
    Images: 'Images',
};
export var ExportPreset;
(function (ExportPreset) {
    ExportPreset[ExportPreset["Passthrough"] = 0] = "Passthrough";
    ExportPreset[ExportPreset["LowQuality"] = 1] = "LowQuality";
    ExportPreset[ExportPreset["MediumQuality"] = 2] = "MediumQuality";
    ExportPreset[ExportPreset["HighestQuality"] = 3] = "HighestQuality";
    ExportPreset[ExportPreset["H264_640x480"] = 4] = "H264_640x480";
    ExportPreset[ExportPreset["H264_960x540"] = 5] = "H264_960x540";
    ExportPreset[ExportPreset["H264_1280x720"] = 6] = "H264_1280x720";
    ExportPreset[ExportPreset["H264_1920x1080"] = 7] = "H264_1920x1080";
    ExportPreset[ExportPreset["H264_3840x2160"] = 8] = "H264_3840x2160";
    ExportPreset[ExportPreset["HEVC_1920x1080"] = 9] = "HEVC_1920x1080";
    ExportPreset[ExportPreset["HEVC_3840x2160"] = 10] = "HEVC_3840x2160";
})(ExportPreset || (ExportPreset = {}));
export { PermissionStatus };
//# sourceMappingURL=ImagePicker.types.js.map