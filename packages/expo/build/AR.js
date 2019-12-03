import Constants from 'expo-constants';
import { Dimensions, NativeEventEmitter, NativeModules, Platform, findNodeHandle, } from 'react-native';
const ExponentAR = NativeModules.ExponentAR || {};
const emitter = new NativeEventEmitter(ExponentAR);
/**
 * Tracking Configuration
 * Options for how ARKit constructs a scene coordinate system based on real-world device motion.
 * https://developer.apple.com/documentation/arkit/arconfiguration
 */
export var TrackingConfiguration;
(function (TrackingConfiguration) {
    /**
     * Provides high-quality AR experiences that use the rear-facing camera precisely track a device's
     * position and orientation and allow plane detection and hit testing.
     */
    TrackingConfiguration["World"] = "ARWorldTrackingConfiguration";
    /**
     * Provides basic AR experiences that use the rear-facing camera and track only a device's
     * orientation.
     */
    TrackingConfiguration["Orientation"] = "AROrientationTrackingConfiguration";
    /**
     * Provides AR experiences that use the front-facing camera and track the movement and expressions
     * of the user's face.
     */
    TrackingConfiguration["Face"] = "ARFaceTrackingConfiguration";
})(TrackingConfiguration || (TrackingConfiguration = {}));
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
export var BlendShape;
(function (BlendShape) {
    BlendShape["BrowDownL"] = "browDown_L";
    BlendShape["BrowDownR"] = "browDown_R";
    BlendShape["BrowInnerUp"] = "browInnerUp";
    BlendShape["BrowOuterUpL"] = "browOuterUp_L";
    BlendShape["BrowOuterUpR"] = "browOuterUp_R";
    BlendShape["CheekPuff"] = "cheekPuff";
    BlendShape["CheekSquintL"] = "cheekSquint_L";
    BlendShape["CheekSquintR"] = "cheekSquint_R";
    BlendShape["EyeBlinkL"] = "eyeBlink_L";
    BlendShape["EyeBlinkR"] = "eyeBlink_R";
    BlendShape["EyeLookDownL"] = "eyeLookDown_L";
    BlendShape["EyeLookDownR"] = "eyeLookDown_R";
    BlendShape["EyeLookInL"] = "eyeLookIn_L";
    BlendShape["EyeLookInR"] = "eyeLookIn_R";
    BlendShape["EyeLookOutL"] = "eyeLookOut_L";
    BlendShape["EyeLookOutR"] = "eyeLookOut_R";
    BlendShape["EyeLookUpL"] = "eyeLookUp_L";
    BlendShape["EyeLookUpR"] = "eyeLookUp_R";
    BlendShape["EyeSquintL"] = "eyeSquint_L";
    BlendShape["EyeSquintR"] = "eyeSquint_R";
    BlendShape["EyeWideL"] = "eyeWide_L";
    BlendShape["EyeWideR"] = "eyeWide_R";
    BlendShape["JawForward"] = "jawForward";
    BlendShape["JawLeft"] = "jawLeft";
    BlendShape["JawOpen"] = "jawOpen";
    BlendShape["JawRight"] = "jawRight";
    BlendShape["MouthClose"] = "mouthClose";
    BlendShape["MouthDimpleL"] = "mouthDimple_L";
    BlendShape["MouthDimpleR"] = "mouthDimple_R";
    BlendShape["MouthFrownL"] = "mouthFrown_L";
    BlendShape["MouthFrownR"] = "mouthFrown_R";
    BlendShape["MouthFunnel"] = "mouthFunnel";
    BlendShape["MouthLeft"] = "mouthLeft";
    BlendShape["MouthLowerDownL"] = "mouthLowerDown_L";
    BlendShape["MouthLowerDownR"] = "mouthLowerDown_R";
    BlendShape["MouthPressL"] = "mouthPress_L";
    BlendShape["MouthPressR"] = "mouthPress_R";
    BlendShape["MouthPucker"] = "mouthPucker";
    BlendShape["MouthRight"] = "mouthRight";
    BlendShape["MouthRollLower"] = "mouthRollLower";
    BlendShape["MouthRollUpper"] = "mouthRollUpper";
    BlendShape["MouthShrugLower"] = "mouthShrugLower";
    BlendShape["MouthShrugUpper"] = "mouthShrugUpper";
    BlendShape["MouthSmileL"] = "mouthSmile_L";
    BlendShape["MouthSmileR"] = "mouthSmile_R";
    BlendShape["MouthStretchL"] = "mouthStretch_L";
    BlendShape["MouthStretchR"] = "mouthStretch_R";
    BlendShape["MouthUpperUpL"] = "mouthUpperUp_L";
    BlendShape["MouthUpperUpR"] = "mouthUpperUp_R";
    BlendShape["NoseSneerL"] = "noseSneer_L";
    BlendShape["NoseSneerR"] = "noseSneer_R";
})(BlendShape || (BlendShape = {}));
export var FaceAnchorProp;
(function (FaceAnchorProp) {
    FaceAnchorProp["Geometry"] = "geometry";
    FaceAnchorProp["BlendShapes"] = "blendShapes";
})(FaceAnchorProp || (FaceAnchorProp = {}));
/**
 * Plane Detection
 * Options for whether and how ARKit detects flat surfaces in captured images.
 * https://developer.apple.com/documentation/arkit/arplanedetection
 */
export var PlaneDetection;
(function (PlaneDetection) {
    /**
     * No plane detection is run
     */
    PlaneDetection["None"] = "none";
    /**
     * Plane detection determines horizontal planes in the scene
     */
    PlaneDetection["Horizontal"] = "horizontal";
    /**
     * Plane detection determines vertical planes in the scene
     */
    PlaneDetection["Vertical"] = "vertical";
})(PlaneDetection || (PlaneDetection = {}));
/**
 * Hit-Test Result Types
 * Possible types for specifying a hit-test search, or for the result of a hit-test search.
 * https://developer.apple.com/documentation/arkit/arhittestresulttype
 */
export var HitTestResultTypes;
(function (HitTestResultTypes) {
    /**
     * Result type from intersecting the nearest feature point.
     */
    HitTestResultTypes["FeaturePoint"] = "featurePoint";
    /**
     * Result type from intersecting a horizontal plane estimate, determined for the current frame.
     */
    HitTestResultTypes["HorizontalPlane"] = "horizontalPlane";
    /**
     * Result type from intersecting a vertical plane estimate, determined for the current frame.
     */
    HitTestResultTypes["VerticalPlane"] = "verticalPlane";
    /**
     * Result type from intersecting with an existing plane anchor.
     */
    HitTestResultTypes["ExistingPlane"] = "existingPlane";
    /**
     * Result type from intersecting with an existing plane anchor, taking into account the plane’s
     * extent.
     */
    HitTestResultTypes["ExistingPlaneUsingExtent"] = "existingPlaneUsingExtent";
    /**
     * Result type from intersecting with an existing plane anchor, taking into account the plane’s
     * geometry.
     */
    HitTestResultTypes["ExistingPlaneUsingGeometry"] = "existingPlaneUsingGeometry";
})(HitTestResultTypes || (HitTestResultTypes = {}));
/**
 * World Alignment
 * Options for how ARKit constructs a scene coordinate system based on real-world device motion.
 * https://developer.apple.com/documentation/arkit/arworldalignment
 */
export var WorldAlignment;
(function (WorldAlignment) {
    /**
     * Aligns the world with gravity that is defined by vector (0, -1, 0).
     */
    WorldAlignment["Gravity"] = "gravity";
    /**
     * Aligns the world with gravity that is defined by the vector (0, -1, 0) and heading (w.r.t. true
     * north) that is given by the vector (0, 0, -1).
     */
    WorldAlignment["GravityAndHeading"] = "gravityAndHeading";
    /**
     * Aligns the world with the camera’s orientation.
     */
    WorldAlignment["AlignmentCamera"] = "alignmentCamera";
})(WorldAlignment || (WorldAlignment = {}));
export var EventType;
(function (EventType) {
    EventType[EventType["FrameDidUpdate"] = ExponentAR.frameDidUpdate] = "FrameDidUpdate";
    EventType[EventType["DidFailWithError"] = ExponentAR.didFailWithError] = "DidFailWithError";
    EventType[EventType["AnchorsDidUpdate"] = ExponentAR.anchorsDidUpdate] = "AnchorsDidUpdate";
    EventType[EventType["CameraDidChangeTrackingState"] = ExponentAR.cameraDidChangeTrackingState] = "CameraDidChangeTrackingState";
    EventType[EventType["SessionWasInterrupted"] = ExponentAR.sessionWasInterrupted] = "SessionWasInterrupted";
    EventType[EventType["SessionInterruptionEnded"] = ExponentAR.sessionInterruptionEnded] = "SessionInterruptionEnded";
})(EventType || (EventType = {}));
export var AnchorType;
(function (AnchorType) {
    AnchorType["Face"] = "ARFaceAnchor";
    AnchorType["Image"] = "ARImageAnchor";
    AnchorType["Plane"] = "ARPlaneAnchor";
    AnchorType["Anchor"] = "ARAnchor";
})(AnchorType || (AnchorType = {}));
export var AnchorEventType;
(function (AnchorEventType) {
    AnchorEventType["Add"] = "add";
    AnchorEventType["Update"] = "update";
    AnchorEventType["Remove"] = "remove";
})(AnchorEventType || (AnchorEventType = {}));
export var FrameAttribute;
(function (FrameAttribute) {
    FrameAttribute["Anchors"] = "anchors";
    FrameAttribute["RawFeaturePoints"] = "rawFeaturePoints";
    FrameAttribute["LightEstimation"] = "lightEstimation";
    FrameAttribute["CapturedDepthData"] = "capturedDepthData";
})(FrameAttribute || (FrameAttribute = {}));
export var TrackingState;
(function (TrackingState) {
    /** Tracking is not available. */
    TrackingState["NotAvailable"] = "ARTrackingStateNotAvailable";
    /** Tracking is limited. See tracking reason for details. */
    TrackingState["Limited"] = "ARTrackingStateLimited";
    /** Tracking is Normal. */
    TrackingState["Normal"] = "ARTrackingStateNormal";
})(TrackingState || (TrackingState = {}));
export var TrackingStateReason;
(function (TrackingStateReason) {
    /** Tracking is not limited. */
    TrackingStateReason["None"] = "ARTrackingStateReasonNone";
    /** Tracking is limited due to initialization in progress. */
    TrackingStateReason["Initializing"] = "ARTrackingStateReasonInitializing";
    /** Tracking is limited due to a excessive motion of the camera. */
    TrackingStateReason["ExcessiveMotion"] = "ARTrackingStateReasonExcessiveMotion";
    /** Tracking is limited due to a lack of features visible to the camera. */
    TrackingStateReason["InsufficientFeatures"] = "ARTrackingStateReasonInsufficientFeatures";
    /** Tracking is limited due to a relocalization in progress. */
    TrackingStateReason["Relocalizing"] = "ARTrackingStateReasonRelocalizing";
})(TrackingStateReason || (TrackingStateReason = {}));
export function getVersion() {
    return ExponentAR.ARKitVersion;
}
const AvailabilityErrorMessages = {
    Simulator: `Cannot run EXGL in a simulator`,
    ANineChip: `ARKit can only run on iOS devices with A9 (2015) or greater chips! This is a`,
    ARKitOnlyOnIOS: `ARKit can only run on an iOS device! This is a`,
};
export function isAvailable() {
    // Device has A9 chip
    const hasA9Chip = Constants.deviceYearClass && Constants.deviceYearClass > 2014;
    if (!Constants.isDevice || // Prevent Simulators
        // @ts-ignore
        Platform.isTVOS ||
        Platform.OS !== 'ios' || // Device is iOS
        !hasA9Chip ||
        !ExponentAR.isSupported || // ARKit is included in the build
        !ExponentAR.startAsync // Older SDK versions (27 and lower) that are fully compatible
    ) {
        return false;
    }
    return true;
}
export function getUnavailabilityReason() {
    if (!Constants.isDevice) {
        return AvailabilityErrorMessages.Simulator;
    }
    else if (Platform.OS !== 'ios') {
        return `${AvailabilityErrorMessages.ARKitOnlyOnIOS} ${Platform.OS} device`;
    }
    else if (Constants.deviceYearClass == null || Constants.deviceYearClass < 2015) {
        return `${AvailabilityErrorMessages.ANineChip} ${Constants.deviceYearClass} device`;
    }
    return 'Unknown Reason';
}
export function onFrameDidUpdate(listener) {
    return _addListener(EventType.FrameDidUpdate, listener);
}
export function onDidFailWithError(listener) {
    return _addListener(EventType.DidFailWithError, listener);
}
export function onAnchorsDidUpdate(listener) {
    return _addListener(EventType.AnchorsDidUpdate, listener);
}
export function onCameraDidChangeTrackingState(listener) {
    return _addListener(EventType.CameraDidChangeTrackingState, listener);
}
export function onSessionWasInterrupted(listener) {
    return _addListener(EventType.SessionWasInterrupted, listener);
}
export function onSessionInterruptionEnded(listener) {
    return _addListener(EventType.SessionInterruptionEnded, listener);
}
function _addListener(eventType, event) {
    return emitter.addListener(eventType, event);
}
export function removeAllListeners(eventType) {
    emitter.removeAllListeners(eventType);
}
// TODO: support multiple types (take an array or bit flags)
export function performHitTest(point, types) {
    if (ExponentAR.performHitTest) {
        return ExponentAR.performHitTest(point, types);
    }
    throw new Error(`AR hit testing is not supported on this device`);
}
export async function setDetectionImagesAsync(images) {
    if (ExponentAR.setDetectionImagesAsync) {
        await ExponentAR.setDetectionImagesAsync(images);
    }
}
export function getCurrentFrame(attributes) {
    if (ExponentAR.getCurrentFrame) {
        return ExponentAR.getCurrentFrame(attributes);
    }
    throw new Error(`AR is not supported on this device`);
}
export function getARMatrices(near, far) {
    if (ExponentAR.getARMatrices) {
        return ExponentAR.getARMatrices(near, far);
    }
    throw new Error(`AR is not supported on this device`);
}
export async function stopAsync() {
    if (ExponentAR.stopAsync) {
        await ExponentAR.stopAsync();
    }
}
export async function startAsync(node, configuration) {
    let handle = typeof node === 'number' ? node : _getNodeHandle(node);
    if (ExponentAR.startAsync) {
        return await ExponentAR.startAsync(handle, configuration);
    }
    throw new Error(`AR is not supported on this device`);
}
function _getNodeHandle(component) {
    let handle = findNodeHandle(component);
    if (handle === null) {
        throw new Error(`Could not find the React node handle for the AR component: ${component}`);
    }
    return handle;
}
export function reset() {
    if (ExponentAR.reset) {
        ExponentAR.reset();
    }
}
export function resume() {
    if (ExponentAR.resume) {
        ExponentAR.resume();
    }
}
export function pause() {
    if (ExponentAR.pause) {
        ExponentAR.pause();
    }
}
export async function setConfigurationAsync(configuration) {
    if (ExponentAR.setConfigurationAsync) {
        await ExponentAR.setConfigurationAsync(configuration);
    }
}
export function getProvidesAudioData() {
    if (ExponentAR.getProvidesAudioData) {
        return ExponentAR.getProvidesAudioData();
    }
    return false;
}
export function setProvidesAudioData(providesAudioData) {
    if (ExponentAR.setProvidesAudioData) {
        ExponentAR.setProvidesAudioData(providesAudioData);
    }
}
export function setPlaneDetection(planeDetection) {
    if (ExponentAR.setPlaneDetection) {
        ExponentAR.setPlaneDetection(planeDetection);
    }
}
export function getPlaneDetection() {
    if (ExponentAR.getPlaneDetection) {
        return ExponentAR.getPlaneDetection();
    }
    throw new Error(`AR plane detection is not supported on this device`);
}
export function getCameraTexture() {
    if (ExponentAR.getCameraTexture) {
        return ExponentAR.getCameraTexture();
    }
    throw new Error(`AR camera textures are not supported on this device`);
}
export async function setWorldOriginAsync(matrix_float4x4) {
    if (ExponentAR.setWorldOriginAsync) {
        await ExponentAR.setWorldOriginAsync(matrix_float4x4);
    }
}
export function setLightEstimationEnabled(isLightEstimationEnabled) {
    if (ExponentAR.setLightEstimationEnabled) {
        ExponentAR.setLightEstimationEnabled(isLightEstimationEnabled);
    }
}
export function getLightEstimationEnabled() {
    if (ExponentAR.getLightEstimationEnabled) {
        return ExponentAR.getLightEstimationEnabled();
    }
    return false;
}
export function setAutoFocusEnabled(isAutoFocusEnabled) {
    if (ExponentAR.setAutoFocusEnabled) {
        ExponentAR.setAutoFocusEnabled(isAutoFocusEnabled);
    }
}
export function getAutoFocusEnabled() {
    if (ExponentAR.getAutoFocusEnabled) {
        return ExponentAR.getAutoFocusEnabled();
    }
    return false;
}
export function setWorldAlignment(worldAlignment) {
    if (ExponentAR.setWorldAlignment) {
        ExponentAR.setWorldAlignment(worldAlignment);
    }
}
export function getWorldAlignment() {
    if (ExponentAR.getWorldAlignment) {
        return ExponentAR.getWorldAlignment();
    }
    throw new Error(`AR world alignment is not supported on this device`);
}
export function isConfigurationAvailable(configuration) {
    const { width, height } = Dimensions.get('window');
    // @ts-ignore: re-evaluate this for the new iPhones (2018)
    const isX = (width === 812 || height === 812) && !Platform.isTVOS && !Platform.isPad;
    if (configuration === TrackingConfiguration.Face && isX && isAvailable()) {
        return true;
    }
    return !!ExponentAR[configuration];
}
export function getSupportedVideoFormats(configuration) {
    const videoFormats = {
        [TrackingConfiguration.World]: 'WorldTrackingVideoFormats',
        [TrackingConfiguration.Orientation]: 'OrientationTrackingVideoFormats',
        [TrackingConfiguration.Face]: 'FaceTrackingVideoFormats',
    };
    const videoFormat = videoFormats[configuration];
    return ExponentAR[videoFormat] || [];
}
export function isFrontCameraAvailable() {
    return isConfigurationAvailable(TrackingConfiguration.Face);
}
export function isRearCameraAvailable() {
    return isConfigurationAvailable(TrackingConfiguration.World);
}
/* Legacy constants */
/**
 * A deprecated alias for `PlaneDetection`
 * July 8, 2019
 */
export const PlaneDetectionTypes = PlaneDetection;
/**
 * A deprecated alias for `WorldAlignment`
 * July 8, 2019
 */
export const WorldAlignmentTypes = WorldAlignment;
/**
 * A deprecated alias for `EventType`
 * July 8, 2019
 */
export const EventTypes = EventType;
/**
 * A deprecated alias for `AnchorType`
 * July 8, 2019
 */
export const AnchorTypes = AnchorType;
/**
 * A deprecated alias for `AnchorEventType`
 * July 8, 2019
 */
export const AnchorEventTypes = AnchorEventType;
/**
 * A deprecated alias for `FrameAttribute`
 * July 8, 2019
 */
export const FrameAttributes = FrameAttribute;
/**
 * A deprecated alias for `TrackingState`
 * July 8, 2019
 */
export const TrackingStates = TrackingState;
/**
 * A deprecated alias for `TrackingStateReason`
 * July 8, 2019
 */
export const TrackingStateReasons = TrackingStateReason;
/**
 * A deprecated alias for `TrackingConfiguration`
 * July 8, 2019
 */
export const TrackingConfigurations = TrackingConfiguration;
//# sourceMappingURL=AR.js.map