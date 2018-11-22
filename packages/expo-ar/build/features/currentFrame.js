import { NativeAR } from '../NativeAR';
/**
 * Attributes that are available to be queried from current frame.
 * See {@link getCurrentFrameAsync}
 */
export var FrameAttribute;
(function (FrameAttribute) {
    FrameAttribute["Anchors"] = "anchors";
    FrameAttribute["Planes"] = "planes";
    FrameAttribute["RawFeaturePoints"] = "rawFeaturePoints";
    FrameAttribute["LightEstimation"] = "lightEstimation";
    FrameAttribute["CapturedDepthData"] = "capturedDepthData";
})(FrameAttribute || (FrameAttribute = {}));
export var DepthDataQuality;
(function (DepthDataQuality) {
    DepthDataQuality["Low"] = "AVDepthDataQualityLow";
    DepthDataQuality["High"] = "AVDepthDataQualityHigh";
})(DepthDataQuality || (DepthDataQuality = {}));
export var DepthDataAccuracy;
(function (DepthDataAccuracy) {
    DepthDataAccuracy["Absolute"] = "AVDepthDataAccuracyAbsolute";
    DepthDataAccuracy["Relative"] = "AVDepthDataAccuracyRelative";
})(DepthDataAccuracy || (DepthDataAccuracy = {}));
export var PlaneType;
(function (PlaneType) {
    PlaneType["VERTICAL"] = "vertical";
    PlaneType["HORIZONTAL_UPWARD_FACING"] = "horizontalUpwardFacing";
    PlaneType["HORIZONTAL_DOWNWARD_FACING"] = "horizontalDownwardFacing";
})(PlaneType || (PlaneType = {}));
;
/**
 * Requests data from current frame.
 * @param attributes Specification which data to query from frame.
 */
export async function getCurrentFrameAsync(attributes) {
    return NativeAR.getCurrentFrameAsync(attributes);
}
//# sourceMappingURL=currentFrame.js.map