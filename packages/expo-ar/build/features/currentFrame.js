import { colorTemperature2rgb } from 'color-temperature';
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
var LightEstimationAndroidState;
(function (LightEstimationAndroidState) {
    LightEstimationAndroidState["VALID"] = "valid";
    LightEstimationAndroidState["INVALID"] = "invalid";
})(LightEstimationAndroidState || (LightEstimationAndroidState = {}));
function isLightEstimationIOS(lightEstimation) {
    return !!lightEstimation.ambientIntensity;
}
function isLightEstimationAndroid(lightEstimation) {
    return !!lightEstimation.pixelIntensity;
}
function handleLightEstimationInconsistencies(lightEstimation) {
    if (isLightEstimationIOS(lightEstimation)) {
        const { ambientColorTemperature, ambientIntensity } = lightEstimation;
        const { red, green, blue } = colorTemperature2rgb(ambientColorTemperature);
        return {
            red,
            green,
            blue,
            ambientIntensity,
            iOS: lightEstimation,
        };
    }
    if (isLightEstimationAndroid(lightEstimation)) {
        return {
            ...lightEstimation,
            android: lightEstimation,
        };
    }
    throw new Error(`getCurrentFrameAsync#LightEstimation returned unknown results: ${JSON.stringify(lightEstimation)}`);
}
/**
 * Requests data from current frame.
 * @param attributes Specification which data to query from frame.
 */
export async function getCurrentFrameAsync(attributes) {
    const frame = await NativeAR.getCurrentFrameAsync(attributes);
    if (attributes[FrameAttribute.LightEstimation]) {
        frame.lightEstimation = handleLightEstimationInconsistencies(frame.lightEstimation);
    }
    return frame;
}
//# sourceMappingURL=currentFrame.js.map