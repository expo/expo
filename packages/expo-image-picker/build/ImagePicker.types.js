import { PermissionStatus } from 'unimodules-permissions-interface';
export const MediaTypeOptions = {
    All: 'All',
    Videos: 'Videos',
    Images: 'Images',
};
export var ExportPresets;
(function (ExportPresets) {
    ExportPresets[ExportPresets["LowQuality"] = 0] = "LowQuality";
    ExportPresets[ExportPresets["MediumQuality"] = 1] = "MediumQuality";
    ExportPresets[ExportPresets["HighestQuality"] = 2] = "HighestQuality";
    ExportPresets[ExportPresets["Passthrough"] = 3] = "Passthrough";
    ExportPresets[ExportPresets["H264_640x480"] = 4] = "H264_640x480";
    ExportPresets[ExportPresets["H264_960x540"] = 5] = "H264_960x540";
    ExportPresets[ExportPresets["H264_1280x720"] = 6] = "H264_1280x720";
    ExportPresets[ExportPresets["H264_1920x1080"] = 7] = "H264_1920x1080";
    ExportPresets[ExportPresets["H264_3840x2160"] = 8] = "H264_3840x2160";
    ExportPresets[ExportPresets["HEVC_1920x1080"] = 9] = "HEVC_1920x1080";
    ExportPresets[ExportPresets["HEVC_3840x2160"] = 10] = "HEVC_3840x2160";
})(ExportPresets || (ExportPresets = {}));
export { PermissionStatus };
//# sourceMappingURL=ImagePicker.types.js.map