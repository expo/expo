import { NativeModulesProxy } from 'expo-core';

const ExpoAR = NativeModulesProxy.ExpoAR;

/**
 * Tracking Configuration
 * Options for how ARKit constructs a scene coordinate system based on real-world device motion.
 * https://developer.apple.com/documentation/arkit/arconfiguration
 */
export enum TrackingConfiguration {
  /**
   * Provides high-quality AR experiences that use the rear-facing camera precisely track a device's
   * position and orientation and allow plane detection and hit testing.
   */
  World = 'ARWorldTrackingConfiguration',
  /**
   * Provides basic AR experiences that use the rear-facing camera and track only a device's
   * orientation.
   */
  Orientation = 'AROrientationTrackingConfiguration',
  /**
   * Provides AR experiences that use the front-facing camera and track the movement and expressions
   * of the user's face.
   */
  Face = 'ARFaceTrackingConfiguration',
}

export enum DepthDataQuality {
  Low = 'AVDepthDataQualityLow',
  High = 'AVDepthDataQualityHigh',
}

export enum DepthDataAccuracy {
  Absolute = 'AVDepthDataAccuracyAbsolute',
  Relative = 'AVDepthDataAccuracyRelative',
}

export enum BlendShape {
  BrowDownL = 'browDown_L',
  BrowDownR = 'browDown_R',
  BrowInnerUp = 'browInnerUp',
  BrowOuterUpL = 'browOuterUp_L',
  BrowOuterUpR = 'browOuterUp_R',
  CheekPuff = 'cheekPuff',
  CheekSquintL = 'cheekSquint_L',
  CheekSquintR = 'cheekSquint_R',
  EyeBlinkL = 'eyeBlink_L',
  EyeBlinkR = 'eyeBlink_R',
  EyeLookDownL = 'eyeLookDown_L',
  EyeLookDownR = 'eyeLookDown_R',
  EyeLookInL = 'eyeLookIn_L',
  EyeLookInR = 'eyeLookIn_R',
  EyeLookOutL = 'eyeLookOut_L',
  EyeLookOutR = 'eyeLookOut_R',
  EyeLookUpL = 'eyeLookUp_L',
  EyeLookUpR = 'eyeLookUp_R',
  EyeSquintL = 'eyeSquint_L',
  EyeSquintR = 'eyeSquint_R',
  EyeWideL = 'eyeWide_L',
  EyeWideR = 'eyeWide_R',
  JawForward = 'jawForward',
  JawLeft = 'jawLeft',
  JawOpen = 'jawOpen',
  JawRight = 'jawRight',
  MouthClose = 'mouthClose',
  MouthDimpleL = 'mouthDimple_L',
  MouthDimpleR = 'mouthDimple_R',
  MouthFrownL = 'mouthFrown_L',
  MouthFrownR = 'mouthFrown_R',
  MouthFunnel = 'mouthFunnel',
  MouthLeft = 'mouthLeft',
  MouthLowerDownL = 'mouthLowerDown_L',
  MouthLowerDownR = 'mouthLowerDown_R',
  MouthPressL = 'mouthPress_L',
  MouthPressR = 'mouthPress_R',
  MouthPucker = 'mouthPucker',
  MouthRight = 'mouthRight',
  MouthRollLower = 'mouthRollLower',
  MouthRollUpper = 'mouthRollUpper',
  MouthShrugLower = 'mouthShrugLower',
  MouthShrugUpper = 'mouthShrugUpper',
  MouthSmileL = 'mouthSmile_L',
  MouthSmileR = 'mouthSmile_R',
  MouthStretchL = 'mouthStretch_L',
  MouthStretchR = 'mouthStretch_R',
  MouthUpperUpL = 'mouthUpperUp_L',
  MouthUpperUpR = 'mouthUpperUp_R',
  NoseSneerL = 'noseSneer_L',
  NoseSneerR = 'noseSneer_R',
}

export enum FaceAnchorProp {
  Geometry = 'geometry',
  BlendShapes = 'blendShapes',
}


/**
 * Plane Detection
 * Options for whether and how ARKit detects flat surfaces in captured images.
 * https://developer.apple.com/documentation/arkit/arplanedetection
 * 
 * ARCore
 * https://developers.google.com/ar/reference/java/com/google/ar/core/Config.PlaneFindingMode
 */
export enum PlaneDetection {
  /**
   * No plane detection is run
   */
  None = 'none',
  /**
   * Plane detection determines horizontal planes in the scene
   */
  Horizontal = 'horizontal',
  /**
   * Plane detection determines vertical planes in the scene
   */
  Vertical = 'vertical',
  /**
   * Detection both horizontal and vertical planes
   * @Android only
   */
  HorizontalAndVertical = 'horizontal_and_vertical',
}

/**
 * Hit-Test Result Types
 * Possible types for specifying a hit-test search, or for the result of a hit-test search.
 * https://developer.apple.com/documentation/arkit/arhittestresulttype
 */
export enum HitTestResultType {
  /**
   * Result type from intersecting the nearest feature point.
   */
  FeaturePoint = 'featurePoint',
  /**
   * Result type from intersecting a horizontal plane estimate, determined for the current frame.
   */
  HorizontalPlane = 'horizontalPlane',
  /**
   * Result type from intersecting a vertical plane estimate, determined for the current frame.
   */
  VerticalPlane = 'verticalPlane',
  /**
   * Result type from intersecting with an existing plane anchor.
   */
  ExistingPlane = 'existingPlane',
  /**
   * Result type from intersecting with an existing plane anchor, taking into account the plane’s
   * extent.
   */
  ExistingPlaneUsingExtent = 'existingPlaneUsingExtent',
  /**
   * Result type from intersecting with an existing plane anchor, taking into account the plane’s
   * geometry.
   */
  ExistingPlaneUsingGeometry = 'existingPlaneUsingGeometry',
}

/**
 * World Alignment
 * Options for how ARKit constructs a scene coordinate system based on real-world device motion.
 * https://developer.apple.com/documentation/arkit/arworldalignment
 */
export enum WorldAlignment {
  /**
   * Aligns the world with gravity that is defined by vector (0, -1, 0).
   */
  Gravity = 'gravity',
  /**
   * Aligns the world with gravity that is defined by the vector (0, -1, 0) and heading (w.r.t. true
   * north) that is given by the vector (0, 0, -1).
   */
  GravityAndHeading = 'gravityAndHeading',
  /**
   * Aligns the world with the camera’s orientation.
   */
  AlignmentCamera = 'alignmentCamera',
}

export enum EventType {
  FrameDidUpdate = ExpoAR.frameDidUpdate,
  DidFailWithError = ExpoAR.didFailWithError,
  AnchorsDidUpdate = ExpoAR.anchorsDidUpdate,
  CameraDidChangeTrackingState = ExpoAR.cameraDidChangeTrackingState,
  SessionWasInterrupted = ExpoAR.sessionWasInterrupted,
  SessionInterruptionEnded = ExpoAR.sessionInterruptionEnded,
}

export enum AnchorType {
  Face = 'ARFaceAnchor',
  Image = 'ARImageAnchor',
  Plane = 'ARPlaneAnchor',
  Anchor = 'ARAnchor',
}

export enum AnchorEventType {
  Add = 'add',
  Update = 'update',
  Remove = 'remove',
}

export enum FrameAttribute {
  Anchors = 'anchors',
  Planes = 'planes',
  RawFeaturePoints = 'rawFeaturePoints',
  LightEstimation = 'lightEstimation',
  CapturedDepthData = 'capturedDepthData',
}

export enum TrackingState {
  /** Tracking is not available. */
  NotAvailable = 'ARTrackingStateNotAvailable',
  /** Tracking is limited. See tracking reason for details. */
  Limited = 'ARTrackingStateLimited',
  /** Tracking is Normal. */
  Normal = 'ARTrackingStateNormal',
}

export enum TrackingStateReason {
  /** Tracking is not limited. */
  None = 'ARTrackingStateReasonNone',

  /** Tracking is limited due to initialization in progress. */
  Initializing = 'ARTrackingStateReasonInitializing',

  /** Tracking is limited due to a excessive motion of the camera. */
  ExcessiveMotion = 'ARTrackingStateReasonExcessiveMotion',

  /** Tracking is limited due to a lack of features visible to the camera. */
  InsufficientFeatures = 'ARTrackingStateReasonInsufficientFeatures',

  /** Tracking is limited due to a relocalization in progress. */
  Relocalizing = 'ARTrackingStateReasonRelocalizing',
}
