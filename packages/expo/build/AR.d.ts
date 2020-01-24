import * as React from 'react';
import { EmitterSubscription } from 'react-native';
/**
 * Tracking Configuration
 * Options for how ARKit constructs a scene coordinate system based on real-world device motion.
 * https://developer.apple.com/documentation/arkit/arconfiguration
 */
export declare enum TrackingConfiguration {
    /**
     * Provides high-quality AR experiences that use the rear-facing camera precisely track a device's
     * position and orientation and allow plane detection and hit testing.
     */
    World = "ARWorldTrackingConfiguration",
    /**
     * Provides basic AR experiences that use the rear-facing camera and track only a device's
     * orientation.
     */
    Orientation = "AROrientationTrackingConfiguration",
    /**
     * Provides AR experiences that use the front-facing camera and track the movement and expressions
     * of the user's face.
     */
    Face = "ARFaceTrackingConfiguration"
}
export declare enum DepthDataQuality {
    Low = "AVDepthDataQualityLow",
    High = "AVDepthDataQualityHigh"
}
export declare enum DepthDataAccuracy {
    Absolute = "AVDepthDataAccuracyAbsolute",
    Relative = "AVDepthDataAccuracyRelative"
}
export declare type Size = {
    width: number;
    height: number;
};
export declare type Vector3 = {
    x: number;
    y: number;
    z: number;
};
export declare type Vector2 = {
    x: number;
    y: number;
};
export declare type TextureCoordinate = {
    u: number;
    v: number;
};
export declare type Matrix = number[];
export declare type FaceGeometry = {
    vertexCount: number;
    textureCoordinateCount: number;
    triangleCount: number;
    vertices: Vector3[];
    textureCoordinates: TextureCoordinate[];
    triangleIndices: number[];
};
export declare type BaseAnchor = {
    type: AnchorType;
    transform: Matrix;
    id: string;
};
export declare type PlaneAnchor = BaseAnchor & {
    type: AnchorType.Plane;
    center: Vector3;
    extent: {
        width: number;
        length: number;
    };
};
export declare type ImageAnchor = BaseAnchor & {
    type: AnchorType.Image;
    image?: {
        name: string | null;
        size: Size;
    };
};
export declare type FaceAnchor = BaseAnchor & {
    type: AnchorType.Face;
    isTracked: boolean;
    geometry?: FaceGeometry;
    blendShapes?: {
        [shape in BlendShape]?: number;
    };
};
export declare type Anchor = BaseAnchor | PlaneAnchor | ImageAnchor | FaceAnchor;
export declare type HitTest = {
    type: number;
    distance: number;
    localTransform: number[];
    worldTransform: number[];
    anchor: Anchor;
};
export declare type HitTestResults = {
    hitTest: HitTest[];
};
export declare type DetectionImage = {
    uri: string;
    width: number;
    name?: string;
};
export declare type ARFrameAnchorRequest = {
    ARFaceTrackingConfiguration?: {
        geometry?: boolean;
        blendShapes?: boolean | BlendShape[];
    };
};
export declare type ARFrameRequest = {
    anchors?: ARFrameAnchorRequest;
    rawFeaturePoints?: boolean;
    lightEstimation?: boolean;
    capturedDepthData?: boolean;
};
export declare type LightEstimation = {
    ambientIntensity: number;
    ambientColorTemperature: number;
    primaryLightDirection?: Vector3;
    primaryLightIntensity?: number;
};
export declare type RawFeaturePoint = {
    x: number;
    y: number;
    z: number;
    id: string;
};
export declare type CameraCalibrationData = {
    intrinsicMatrix: Matrix;
    intrinsicMatrixReferenceDimensions: Size;
    extrinsicMatrix: Matrix;
    pixelSize: number;
    lensDistortionLookupTable: any;
    inverseLensDistortionLookupTable: any;
    lensDistortionCenter: Vector3;
};
export declare type CapturedDepthData = {
    timestamp: number;
    depthDataQuality: DepthDataQuality;
    depthDataAccuracy: DepthDataAccuracy;
    depthDataFiltered: boolean;
    cameraCalibrationData: CameraCalibrationData;
};
export declare type ARFrame = {
    timestamp: number;
    anchors?: Anchor[] | null;
    rawFeaturePoints?: RawFeaturePoint[] | null;
    lightEstimation?: LightEstimation | null;
    capturedDepthData?: CapturedDepthData | null;
};
export declare type ARMatrices = {
    transform: Matrix;
    viewMatrix: Matrix;
    projectionMatrix: Matrix;
};
declare type ARStartResult = {
    capturedImageTexture: number;
};
declare type ReactNativeNodeHandle = number;
export declare type ImageResolution = {
    width: number;
    height: number;
};
export declare type VideoFormat = {
    type: string;
    imageResolution: ImageResolution;
    framesPerSecond: number;
};
export declare enum BlendShape {
    BrowDownL = "browDown_L",
    BrowDownR = "browDown_R",
    BrowInnerUp = "browInnerUp",
    BrowOuterUpL = "browOuterUp_L",
    BrowOuterUpR = "browOuterUp_R",
    CheekPuff = "cheekPuff",
    CheekSquintL = "cheekSquint_L",
    CheekSquintR = "cheekSquint_R",
    EyeBlinkL = "eyeBlink_L",
    EyeBlinkR = "eyeBlink_R",
    EyeLookDownL = "eyeLookDown_L",
    EyeLookDownR = "eyeLookDown_R",
    EyeLookInL = "eyeLookIn_L",
    EyeLookInR = "eyeLookIn_R",
    EyeLookOutL = "eyeLookOut_L",
    EyeLookOutR = "eyeLookOut_R",
    EyeLookUpL = "eyeLookUp_L",
    EyeLookUpR = "eyeLookUp_R",
    EyeSquintL = "eyeSquint_L",
    EyeSquintR = "eyeSquint_R",
    EyeWideL = "eyeWide_L",
    EyeWideR = "eyeWide_R",
    JawForward = "jawForward",
    JawLeft = "jawLeft",
    JawOpen = "jawOpen",
    JawRight = "jawRight",
    MouthClose = "mouthClose",
    MouthDimpleL = "mouthDimple_L",
    MouthDimpleR = "mouthDimple_R",
    MouthFrownL = "mouthFrown_L",
    MouthFrownR = "mouthFrown_R",
    MouthFunnel = "mouthFunnel",
    MouthLeft = "mouthLeft",
    MouthLowerDownL = "mouthLowerDown_L",
    MouthLowerDownR = "mouthLowerDown_R",
    MouthPressL = "mouthPress_L",
    MouthPressR = "mouthPress_R",
    MouthPucker = "mouthPucker",
    MouthRight = "mouthRight",
    MouthRollLower = "mouthRollLower",
    MouthRollUpper = "mouthRollUpper",
    MouthShrugLower = "mouthShrugLower",
    MouthShrugUpper = "mouthShrugUpper",
    MouthSmileL = "mouthSmile_L",
    MouthSmileR = "mouthSmile_R",
    MouthStretchL = "mouthStretch_L",
    MouthStretchR = "mouthStretch_R",
    MouthUpperUpL = "mouthUpperUp_L",
    MouthUpperUpR = "mouthUpperUp_R",
    NoseSneerL = "noseSneer_L",
    NoseSneerR = "noseSneer_R"
}
export declare enum FaceAnchorProp {
    Geometry = "geometry",
    BlendShapes = "blendShapes"
}
/**
 * Plane Detection
 * Options for whether and how ARKit detects flat surfaces in captured images.
 * https://developer.apple.com/documentation/arkit/arplanedetection
 */
export declare enum PlaneDetection {
    /**
     * No plane detection is run
     */
    None = "none",
    /**
     * Plane detection determines horizontal planes in the scene
     */
    Horizontal = "horizontal",
    /**
     * Plane detection determines vertical planes in the scene
     */
    Vertical = "vertical"
}
/**
 * Hit-Test Result Types
 * Possible types for specifying a hit-test search, or for the result of a hit-test search.
 * https://developer.apple.com/documentation/arkit/arhittestresulttype
 */
export declare enum HitTestResultTypes {
    /**
     * Result type from intersecting the nearest feature point.
     */
    FeaturePoint = "featurePoint",
    /**
     * Result type from intersecting a horizontal plane estimate, determined for the current frame.
     */
    HorizontalPlane = "horizontalPlane",
    /**
     * Result type from intersecting a vertical plane estimate, determined for the current frame.
     */
    VerticalPlane = "verticalPlane",
    /**
     * Result type from intersecting with an existing plane anchor.
     */
    ExistingPlane = "existingPlane",
    /**
     * Result type from intersecting with an existing plane anchor, taking into account the plane’s
     * extent.
     */
    ExistingPlaneUsingExtent = "existingPlaneUsingExtent",
    /**
     * Result type from intersecting with an existing plane anchor, taking into account the plane’s
     * geometry.
     */
    ExistingPlaneUsingGeometry = "existingPlaneUsingGeometry"
}
/**
 * World Alignment
 * Options for how ARKit constructs a scene coordinate system based on real-world device motion.
 * https://developer.apple.com/documentation/arkit/arworldalignment
 */
export declare enum WorldAlignment {
    /**
     * Aligns the world with gravity that is defined by vector (0, -1, 0).
     */
    Gravity = "gravity",
    /**
     * Aligns the world with gravity that is defined by the vector (0, -1, 0) and heading (w.r.t. true
     * north) that is given by the vector (0, 0, -1).
     */
    GravityAndHeading = "gravityAndHeading",
    /**
     * Aligns the world with the camera’s orientation.
     */
    AlignmentCamera = "alignmentCamera"
}
export declare enum EventType {
    FrameDidUpdate,
    DidFailWithError,
    AnchorsDidUpdate,
    CameraDidChangeTrackingState,
    SessionWasInterrupted,
    SessionInterruptionEnded
}
export declare enum AnchorType {
    Face = "ARFaceAnchor",
    Image = "ARImageAnchor",
    Plane = "ARPlaneAnchor",
    Anchor = "ARAnchor"
}
export declare enum AnchorEventType {
    Add = "add",
    Update = "update",
    Remove = "remove"
}
export declare enum FrameAttribute {
    Anchors = "anchors",
    RawFeaturePoints = "rawFeaturePoints",
    LightEstimation = "lightEstimation",
    CapturedDepthData = "capturedDepthData"
}
export declare enum TrackingState {
    /** Tracking is not available. */
    NotAvailable = "ARTrackingStateNotAvailable",
    /** Tracking is limited. See tracking reason for details. */
    Limited = "ARTrackingStateLimited",
    /** Tracking is Normal. */
    Normal = "ARTrackingStateNormal"
}
export declare enum TrackingStateReason {
    /** Tracking is not limited. */
    None = "ARTrackingStateReasonNone",
    /** Tracking is limited due to initialization in progress. */
    Initializing = "ARTrackingStateReasonInitializing",
    /** Tracking is limited due to a excessive motion of the camera. */
    ExcessiveMotion = "ARTrackingStateReasonExcessiveMotion",
    /** Tracking is limited due to a lack of features visible to the camera. */
    InsufficientFeatures = "ARTrackingStateReasonInsufficientFeatures",
    /** Tracking is limited due to a relocalization in progress. */
    Relocalizing = "ARTrackingStateReasonRelocalizing"
}
declare type FrameDidUpdateEvent = object;
declare type DidFailWithErrorEvent = {
    error: Error;
};
declare type AnchorsDidUpdateEvent = {
    eventType: AnchorEventType;
    anchors: Anchor[];
};
declare type CameraDidChangeTrackingStateEvent = {
    trackingState: TrackingState;
    trackingStateReason: TrackingStateReason;
};
declare type SessionWasInterruptedEvent = object;
declare type SessionInterruptionEndedEvent = object;
export declare function getVersion(): string;
export declare function isAvailable(): boolean;
export declare function getUnavailabilityReason(): string;
export declare function onFrameDidUpdate(listener: (event: FrameDidUpdateEvent) => void): EmitterSubscription;
export declare function onDidFailWithError(listener: (event: DidFailWithErrorEvent) => void): EmitterSubscription;
export declare function onAnchorsDidUpdate(listener: (event: AnchorsDidUpdateEvent) => void): EmitterSubscription;
export declare function onCameraDidChangeTrackingState(listener: (event: CameraDidChangeTrackingStateEvent) => void): EmitterSubscription;
export declare function onSessionWasInterrupted(listener: (event: SessionWasInterruptedEvent) => void): EmitterSubscription;
export declare function onSessionInterruptionEnded(listener: (event: SessionInterruptionEndedEvent) => void): EmitterSubscription;
export declare function removeAllListeners(eventType?: EventType): void;
export declare function performHitTest(point: Vector2, types: HitTestResultTypes): HitTestResults;
export declare function setDetectionImagesAsync(images: {
    [name: string]: DetectionImage;
}): Promise<void>;
export declare function getCurrentFrame(attributes?: ARFrameRequest): ARFrame;
export declare function getARMatrices(near: number, far: number): ARMatrices;
export declare function stopAsync(): Promise<void>;
export declare function startAsync(node: ReactNativeNodeHandle | React.Component, configuration: TrackingConfiguration): Promise<ARStartResult>;
export declare function reset(): void;
export declare function resume(): void;
export declare function pause(): void;
export declare function setConfigurationAsync(configuration: TrackingConfiguration): Promise<void>;
export declare function getProvidesAudioData(): boolean;
export declare function setProvidesAudioData(providesAudioData: boolean): void;
export declare function setPlaneDetection(planeDetection: PlaneDetection): void;
export declare function getPlaneDetection(): PlaneDetection;
export declare function getCameraTexture(): number;
export declare function setWorldOriginAsync(matrix_float4x4: Matrix): Promise<void>;
export declare function setLightEstimationEnabled(isLightEstimationEnabled: boolean): void;
export declare function getLightEstimationEnabled(): boolean;
export declare function setAutoFocusEnabled(isAutoFocusEnabled: boolean): void;
export declare function getAutoFocusEnabled(): boolean;
export declare function setWorldAlignment(worldAlignment: WorldAlignment): void;
export declare function getWorldAlignment(): WorldAlignment;
export declare function isConfigurationAvailable(configuration: TrackingConfiguration): boolean;
export declare function getSupportedVideoFormats(configuration: TrackingConfiguration): VideoFormat[];
export declare function isFrontCameraAvailable(): boolean;
export declare function isRearCameraAvailable(): boolean;
/**
 * A deprecated alias for `PlaneDetection`
 * July 8, 2019
 */
export declare const PlaneDetectionTypes: typeof PlaneDetection;
/**
 * A deprecated alias for `WorldAlignment`
 * July 8, 2019
 */
export declare const WorldAlignmentTypes: typeof WorldAlignment;
/**
 * A deprecated alias for `EventType`
 * July 8, 2019
 */
export declare const EventTypes: typeof EventType;
/**
 * A deprecated alias for `AnchorType`
 * July 8, 2019
 */
export declare const AnchorTypes: typeof AnchorType;
/**
 * A deprecated alias for `AnchorEventType`
 * July 8, 2019
 */
export declare const AnchorEventTypes: typeof AnchorEventType;
/**
 * A deprecated alias for `FrameAttribute`
 * July 8, 2019
 */
export declare const FrameAttributes: typeof FrameAttribute;
/**
 * A deprecated alias for `TrackingState`
 * July 8, 2019
 */
export declare const TrackingStates: typeof TrackingState;
/**
 * A deprecated alias for `TrackingStateReason`
 * July 8, 2019
 */
export declare const TrackingStateReasons: typeof TrackingStateReason;
/**
 * A deprecated alias for `TrackingConfiguration`
 * July 8, 2019
 */
export declare const TrackingConfigurations: typeof TrackingConfiguration;
export {};
