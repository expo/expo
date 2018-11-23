import { NativeModulesProxy } from 'expo-core';
const ExpoAR = NativeModulesProxy.ExpoAR;
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
 *
 * ARCore
 * https://developers.google.com/ar/reference/java/com/google/ar/core/Config.PlaneFindingMode
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
    /**
     * Detection both horizontal and vertical planes
     * @Android only
     */
    PlaneDetection["HorizontalAndVertical"] = "horizontal_and_vertical";
})(PlaneDetection || (PlaneDetection = {}));
/**
 * Hit-Test Result Types
 * Possible types for specifying a hit-test search, or for the result of a hit-test search.
 * https://developer.apple.com/documentation/arkit/arhittestresulttype
 *
 * @iOS only
 */
export var HitTestResultType;
(function (HitTestResultType) {
    /**
     * Result type from intersecting the nearest feature point.
     */
    HitTestResultType["FeaturePoint"] = "featurePoint";
    /**
     * Result type from intersecting a horizontal plane estimate, determined for the current frame.
     */
    HitTestResultType["HorizontalPlane"] = "horizontalPlane";
    /**
     * Result type from intersecting a vertical plane estimate, determined for the current frame.
     */
    HitTestResultType["VerticalPlane"] = "verticalPlane";
    /**
     * Result type from intersecting with an existing plane anchor.
     */
    HitTestResultType["ExistingPlane"] = "existingPlane";
    /**
     * Result type from intersecting with an existing plane anchor, taking into account the plane’s
     * extent.
     */
    HitTestResultType["ExistingPlaneUsingExtent"] = "existingPlaneUsingExtent";
    /**
     * Result type from intersecting with an existing plane anchor, taking into account the plane’s
     * geometry.
     */
    HitTestResultType["ExistingPlaneUsingGeometry"] = "existingPlaneUsingGeometry";
})(HitTestResultType || (HitTestResultType = {}));
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
    EventType[EventType["FrameDidUpdate"] = ExpoAR.frameDidUpdate] = "FrameDidUpdate";
    EventType[EventType["DidFailWithError"] = ExpoAR.didFailWithError] = "DidFailWithError";
    EventType[EventType["AnchorsDidUpdate"] = ExpoAR.anchorsDidUpdate] = "AnchorsDidUpdate";
    EventType[EventType["CameraDidChangeTrackingState"] = ExpoAR.cameraDidChangeTrackingState] = "CameraDidChangeTrackingState";
    EventType[EventType["SessionWasInterrupted"] = ExpoAR.sessionWasInterrupted] = "SessionWasInterrupted";
    EventType[EventType["SessionInterruptionEnded"] = ExpoAR.sessionInterruptionEnded] = "SessionInterruptionEnded";
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
    FrameAttribute["Planes"] = "planes";
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
//# sourceMappingURL=enums.js.map