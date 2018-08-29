// @flow
import invariant from 'invariant';
import * as React from 'react';
import {
  Dimensions,
  findNodeHandle,
  NativeEventEmitter,
  NativeModules,
  Platform,
} from 'react-native';

import { Constants } from 'expo-constants';

const ExponentAR = NativeModules.ExponentAR || {};

const emitter = new NativeEventEmitter(ExponentAR);

export type BlendShape = $Enum<{
  browDown_L: string,
  browDown_R: string,
  browInnerUp: string,
  browOuterUp_L: string,
  browOuterUp_R: string,
  cheekPuff: string,
  cheekSquint_L: string,
  cheekSquint_R: string,
  eyeBlink_L: string,
  eyeBlink_R: string,
  eyeLookDown_L: string,
  eyeLookDown_R: string,
  eyeLookIn_L: string,
  eyeLookIn_R: string,
  eyeLookOut_L: string,
  eyeLookOut_R: string,
  eyeLookUp_L: string,
  eyeLookUp_R: string,
  eyeSquint_L: string,
  eyeSquint_R: string,
  eyeWide_L: string,
  eyeWide_R: string,
  jawForward: string,
  jawLeft: string,
  jawOpen: string,
  jawRight: string,
  mouthClose: string,
  mouthDimple_L: string,
  mouthDimple_R: string,
  mouthFrown_L: string,
  mouthFrown_R: string,
  mouthFunnel: string,
  mouthLeft: string,
  mouthLowerDown_L: string,
  mouthLowerDown_R: string,
  mouthPress_L: string,
  mouthPress_R: string,
  mouthPucker: string,
  mouthRight: string,
  mouthRollLower: string,
  mouthRollUpper: string,
  mouthShrugLower: string,
  mouthShrugUpper: string,
  mouthSmile_L: string,
  mouthSmile_R: string,
  mouthStretch_L: string,
  mouthStretch_R: string,
  mouthUpperUp_L: string,
  mouthUpperUp_R: string,
  noseSneer_L: string,
  noseSneer_R: string,
}>;

/**
 * Plane Detection
 * Options for whether and how ARKit detects flat surfaces in captured images.
 * https://developer.apple.com/documentation/arkit/arplanedetection?language
 */
export type PlaneDetection = $Enum<{
  /**
   * No plane detection is run.
   */
  none: string,
  /**
   * Plane detection determines horizontal planes in the scene.
   */
  horizontal: string,
  /**
   * Plane detection determines vertical planes in the scene.
   */
  vertical: string,
}>;

/**
 * Hit Test Result Type
 * Possible types for specifying a hit-test search, or for the result of a hit-test search.
 * https://developer.apple.com/documentation/arkit/arhittestresulttype
 */
export type HitTestResultType = $Enum<{
  /**
   * Result type from intersecting the nearest feature point.
   */
  featurePoint: string,
  /**
   * Result type from intersecting a horizontal plane estimate, determined for the current frame.
   */
  horizontalPlane: string,
  /**
   * Result type from intersecting a vertical plane estimate, determined for the current frame.
   */
  verticalPlane: string,
  /**
   * Result type from intersecting with an existing plane anchor.
   */
  existingPlane: string,
  /**
   * Result type from intersecting with an existing plane anchor, taking into account the plane’s extent.
   */
  existingPlaneUsingExtent: string,
  /**
   * Result type from intersecting with an existing plane anchor, taking into account the plane’s geometry.
   */
  existingPlaneUsingGeometry: string,
}>;

/**
 * World Alignment
 * Options for how ARKit constructs a scene coordinate system based on real-world device motion.
 * https://developer.apple.com/documentation/arkit/arworldalignment
 */
export type WorldAlignment = $Enum<{
  /**
   * Aligns the world with gravity that is defined by vector (0, -1, 0).
   */
  gravity: string,
  /**
   * Aligns the world with gravity that is defined by the vector (0, -1, 0)
   * and heading (w.r.t. True North) that is given by the vector (0, 0, -1).
   */
  gravityAndHeading: string,
  /**
   * Aligns the world with the camera’s orientation.
   */
  alignmentCamera: string,
}>;

export type EventType = $Enum<{
  FRAME_DID_UPDATE: string,
  DID_FAIL_WITH_ERROR: string,
  ANCHORS_DID_UPDATE: string,
  CAMERA_DID_CHANGE_TRACKING_STATE: string,
  SESSION_WAS_INTERRUPTED: string,
  SESSION_INTERRUPTION_ENDE: string,
}>;

export type AnchorType = $Enum<{
  ARFaceAnchor: string,
  ARImageAnchor: string,
  ARPlaneAnchor: string,
  ARAnchor: string,
}>;

/**
 * Tracking Configuration
 * Options for how ARKit constructs a scene coordinate system based on real-world device motion.
 * https://developer.apple.com/documentation/arkit/arconfiguration
 */
export type TrackingConfiguration = $Enum<{
  /**
   * Provides high-quality AR experiences that use the rear-facing camera precisely track a device's position and orientation and allow plane detection and hit testing.
   */
  ARWorldTrackingConfiguration: string,
  /**
   * Provides basic AR experiences that use the rear-facing camera and track only a device's orientation.
   */
  AROrientationTrackingConfiguration: string,
  /**
   * Provides AR experiences that use the front-facing camera and track the movement and expressions of the user's face.
   */
  ARFaceTrackingConfiguration: string,
}>;

export type DepthDataQuality = $Enum<{
  AVDepthDataQualityLow: string,
  AVDepthDataQualityHigh: string,
}>;

export type DepthDataAccuracy = $Enum<{
  AVDepthDataAccuracyAbsolute: string,
  AVDepthDataAccuracyRelative: string,
}>;

type Subscription = {
  remove: () => void,
};

export type Size = {
  width: number,
  height: number,
};

export type Vector3 = {
  x: number,
  y: number,
  z: number,
};

export type Vector2 = {
  x: number,
  y: number,
};

export type TextureCoordinate = {
  u: number,
  v: number,
};

export type Matrix = Array<number>;

export type FaceGeometry = {
  vertexCount: number,
  textureCoordinateCount: number,
  triangleCount: number,
  vertices: Array<Vector3>,
  textureCoordinates: Array<TextureCoordinate>,
  triangleIndices: Array<number>,
};

export type Anchor = {
  type: AnchorType,
  transform: Matrix,
  id: string,
  center?: Vector3,
  extent?: { width: number, length: number },
  image?: {
    name: ?string,
    size: Size,
  },
  geometry?: FaceGeometry,
  blendShapes?: { [BlendShape]: number },
};

export type HitTest = {
  type: number,
  distance: number,
  localTransform: Array<number>,
  worldTransform: Array<number>,
  anchor: Anchor,
};

export type HitTestResults = {
  hitTest: HitTest,
};

export type DetectionImage = {
  uri: string,
  width: number,
  name?: string,
};

export type ARFrameAnchorRequest = {
  ARFaceTrackingConfiguration?: {
    geometry?: boolean,
    blendShapes?: boolean | Array<BlendShape>,
  },
};

export type ARFrameRequest = {
  anchors?: ARFrameAnchorRequest,
  rawFeaturePoints?: boolean,
  lightEstimation?: boolean,
  capturedDepthData?: boolean,
};

export type LightEstimation = {
  ambientIntensity: number,
  ambientColorTemperature: number,
  primaryLightDirection?: Vector3,
  primaryLightIntensity?: number,
};

export type RawFeaturePoint = { x: number, y: number, z: number, id: string };

export type CameraCalibrationData = {
  intrinsicMatrix: Matrix,
  intrinsicMatrixReferenceDimensions: Size,
  extrinsicMatrix: Matrix,
  pixelSize: number,
  lensDistortionLookupTable: any,
  inverseLensDistortionLookupTable: any,
  lensDistortionCenter: Vector3,
};

export type CapturedDepthData = {
  timestamp: number,
  depthDataQuality: DepthDataQuality,
  depthDataAccuracy: DepthDataAccuracy,
  depthDataFiltered: boolean,
  cameraCalibrationData: CameraCalibrationData,
};

export type ARFrame = {
  timestamp: number,
  anchors?: ?Array<Anchor>,
  rawFeaturePoints?: ?Array<RawFeaturePoint>,
  lightEstimation?: ?LightEstimation,
  capturedDepthData?: ?CapturedDepthData,
};

export type ARMatrices = {
  transform: Matrix,
  viewMatrix: Matrix,
  projectionMatrix: Matrix,
};

export type StartResults = {
  error?: string,
  capturedImageTexture?: number,
};

type ReactNativeNodeHandle = number;

export type ImageResolution = {
  width: number,
  height: number,
};

export type VideoFormat = {
  type: string,
  imageResolution: ImageResolution,
  framesPerSecond: number,
};

export const BlendShapes = {
  BrowDownL: 'browDown_L',
  BrowDownR: 'browDown_R',
  BrowInnerUp: 'browInnerUp',
  BrowOuterUpL: 'browOuterUp_L',
  BrowOuterUpR: 'browOuterUp_R',
  CheekPuff: 'cheekPuff',
  CheekSquintL: 'cheekSquint_L',
  CheekSquintR: 'cheekSquint_R',
  EyeBlinkL: 'eyeBlink_L',
  EyeBlinkR: 'eyeBlink_R',
  EyeLookDownL: 'eyeLookDown_L',
  EyeLookDownR: 'eyeLookDown_R',
  EyeLookInL: 'eyeLookIn_L',
  EyeLookInR: 'eyeLookIn_R',
  EyeLookOutL: 'eyeLookOut_L',
  EyeLookOutR: 'eyeLookOut_R',
  EyeLookUpL: 'eyeLookUp_L',
  EyeLookUpR: 'eyeLookUp_R',
  EyeSquintL: 'eyeSquint_L',
  EyeSquintR: 'eyeSquint_R',
  EyeWideL: 'eyeWide_L',
  EyeWideR: 'eyeWide_R',
  JawForward: 'jawForward',
  JawLeft: 'jawLeft',
  JawOpen: 'jawOpen',
  JawRight: 'jawRight',
  MouthClose: 'mouthClose',
  MouthDimpleL: 'mouthDimple_L',
  MouthDimpleR: 'mouthDimple_R',
  MouthFrownL: 'mouthFrown_L',
  MouthFrownR: 'mouthFrown_R',
  MouthFunnel: 'mouthFunnel',
  MouthLeft: 'mouthLeft',
  MouthLowerDownL: 'mouthLowerDown_L',
  MouthLowerDownR: 'mouthLowerDown_R',
  MouthPressL: 'mouthPress_L',
  MouthPressR: 'mouthPress_R',
  MouthPucker: 'mouthPucker',
  MouthRight: 'mouthRight',
  MouthRollLower: 'mouthRollLower',
  MouthRollUpper: 'mouthRollUpper',
  MouthShrugLower: 'mouthShrugLower',
  MouthShrugUpper: 'mouthShrugUpper',
  MouthSmileL: 'mouthSmile_L',
  MouthSmileR: 'mouthSmile_R',
  MouthStretchL: 'mouthStretch_L',
  MouthStretchR: 'mouthStretch_R',
  MouthUpperUpL: 'mouthUpperUp_L',
  MouthUpperUpR: 'mouthUpperUp_R',
  NoseSneerL: 'noseSneer_L',
  NoseSneerR: 'noseSneer_R',
};

export const FaceAnchorProps = {
  Geometry: 'geometry',
  BlendShapes: 'blendShapes',
};

/**
 * Plane Detection Types
 * Convenient constants
 */
export const PlaneDetectionTypes = {
  None: 'none',
  Horizontal: 'horizontal',
  Vertical: 'vertical',
};

/**
 * Hit Test Result Types
 * Convenient constants
 */
export const HitTestResultTypes = {
  FeaturePoint: 'featurePoint',
  HorizontalPlane: 'horizontalPlane',
  VerticalPlane: 'verticalPlane',
  ExistingPlane: 'existingPlane',
  ExistingPlaneUsingExtent: 'existingPlaneUsingExtent',
  ExistingPlaneUsingGeometry: 'existingPlaneUsingGeometry',
};

/**
 * World Alignment Types
 * Convenient constants
 */
export const WorldAlignmentTypes = {
  Gravity: 'gravity',
  GravityAndHeading: 'gravityAndHeading',
  AlignmentCamera: 'alignmentCamera',
};

export const EventTypes = {
  FrameDidUpdate: ExponentAR.frameDidUpdate,
  DidFailWithError: ExponentAR.didFailWithError,
  AnchorsDidUpdate: ExponentAR.anchorsDidUpdate,
  CameraDidChangeTrackingState: ExponentAR.cameraDidChangeTrackingState,
  SessionWasInterrupted: ExponentAR.sessionWasInterrupted,
  SessionInterruptionEnded: ExponentAR.sessionInterruptionEnded,
};

export const AnchorTypes = {
  Face: 'ARFaceAnchor',
  Image: 'ARImageAnchor',
  Plane: 'ARPlaneAnchor',
  Anchor: 'ARAnchor',
};

export const AnchorEventTypes = {
  Add: 'add',
  Update: 'update',
  Remove: 'remove',
};

export const FrameAttributes = {
  Anchors: 'anchors',
  RawFeaturePoints: 'rawFeaturePoints',
  LightEstimation: 'lightEstimation',
  CapturedDepthData: 'capturedDepthData',
};

export const TrackingStates = {
  /** Tracking is not available. */
  NotAvailable: 'ARTrackingStateNotAvailable',
  /** Tracking is limited. See tracking reason for details. */
  Limited: 'ARTrackingStateLimited',
  /** Tracking is Normal. */
  Normal: 'ARTrackingStateNormal',
};

export const TrackingStateReasons = {
  /** Tracking is not limited. */
  None: 'ARTrackingStateReasonNone',

  /** Tracking is limited due to initialization in progress. */
  Initializing: 'ARTrackingStateReasonInitializing',

  /** Tracking is limited due to a excessive motion of the camera. */
  ExcessiveMotion: 'ARTrackingStateReasonExcessiveMotion',

  /** Tracking is limited due to a lack of features visible to the camera. */
  InsufficientFeatures: 'ARTrackingStateReasonInsufficientFeatures',

  /** Tracking is limited due to a relocalization in progress. */
  Relocalizing: 'ARTrackingStateReasonRelocalizing',
};

export const TrackingConfigurations = {
  World: 'ARWorldTrackingConfiguration',
  Orientation: 'AROrientationTrackingConfiguration',
  Face: 'ARFaceTrackingConfiguration',
};

export function getVersion(): string {
  return ExponentAR.ARKitVersion;
}

const AvailabilityErrorMessages = {
  Simulator: `Cannot run EXGL in a simulator`,
  ANineChip: `ARKit can only run on iOS devices with A9 (2015) or greater chips! This is a`,
  ARKitOnlyOnIOS: `ARKit can only run on an iOS device! This is a`,
};

export function isAvailable(): boolean {
  if (
    !Constants.isDevice || // Prevent Simulators
    Platform.isTVOS ||
    Platform.OS !== 'ios' || // Device is iOS
    Constants.deviceYearClass < 2015 || // Device has A9 chip
    !ExponentAR.isSupported || // ARKit is included in the build
    !ExponentAR.startAsync // Older SDK versions (27 and lower) that are fully compatible
  ) {
    return false;
  }

  return true;
}

export function getUnavailabilityReason(): string {
  if (!Constants.isDevice) {
    return AvailabilityErrorMessages.Simulator;
  } else if (Platform.OS !== 'ios') {
    return `${AvailabilityErrorMessages.ARKitOnlyOnIOS} ${Platform.OS} device`;
  } else if (Constants.deviceYearClass < 2015) {
    return `${AvailabilityErrorMessages.ANineChip} ${Constants.deviceYearClass} device`;
  }
  return 'Unknown Reason';
}

export function onFrameDidUpdate(listener: Function): Subscription {
  return addListener(EventTypes.FrameDidUpdate, listener);
}

export function onDidFailWithError(listener: Function): Subscription {
  return addListener(EventTypes.DidFailWithError, listener);
}

export function onAnchorsDidUpdate(listener: Function): Subscription {
  return addListener(EventTypes.AnchorsDidUpdate, listener);
}

export function onCameraDidChangeTrackingState(listener: Function): Subscription {
  return addListener(EventTypes.CameraDidChangeTrackingState, listener);
}

export function onSessionWasInterrupted(listener: Function): Subscription {
  return addListener(EventTypes.SessionWasInterrupted, listener);
}

export function onSessionInterruptionEnded(listener: Function): Subscription {
  return addListener(EventTypes.SessionInterruptionEnded, listener);
}

function removeListener(listener: Subscription) {
  if (emitter.removeSubscription) emitter.removeSubscription(listener);
}

function addListener(eventType: EventType, event: Function): Subscription {
  if (!emitter.addListener) {
    console.warn('Expo.AR.addListener: Could not add listener for event: ', eventType);
    return { remove: () => {} };
  }
  let listener = emitter.addListener(eventType, event);
  listener.remove = () => removeListener(listener);
  return listener;
}

export function removeAllListeners(eventType: EventType) {
  if (emitter.removeAllListeners) emitter.removeAllListeners(eventType);
}

export function performHitTest(point: Vector2, types: HitTestResultType): ?HitTestResults {
  if (ExponentAR.performHitTest) return ExponentAR.performHitTest(point, types);
}

export async function setDetectionImagesAsync(images: { [string]: DetectionImage }): ?Promise<any> {
  if (ExponentAR.setDetectionImagesAsync) return ExponentAR.setDetectionImagesAsync(images);
}

export function getCurrentFrame(attributes: ?ARFrameRequest): ?ARFrame {
  if (ExponentAR.getCurrentFrame) return ExponentAR.getCurrentFrame(attributes);
}

export function getARMatrices(near: number, far: number): ?ARMatrices {
  if (ExponentAR.getARMatrices) return ExponentAR.getARMatrices(near, far);
}

export function stopAsync(): ?Promise<any> {
  if (ExponentAR.stopAsync) return ExponentAR.stopAsync();
}

export function startAsync(
  node: ReactNativeNodeHandle | React.Component<*>,
  configuration: TrackingConfiguration
): ?StartResults {
  let handle = typeof node === 'number' ? node : _getNodeHandle(node);
  return ExponentAR.startAsync && ExponentAR.startAsync(handle, configuration);
}

function _getNodeHandle(component: React.Component<*>): ReactNativeNodeHandle {
  let handle = findNodeHandle(component);
  invariant(
    handle != null,
    `Could not find the React node handle for component to snapshot: %s`,
    component
  );
  return handle;
}

export function reset() {
  if (ExponentAR.reset) ExponentAR.reset();
}

export function resume() {
  if (ExponentAR.resume) ExponentAR.resume();
}

export function pause() {
  if (ExponentAR.pause) ExponentAR.pause();
}

export function setConfigurationAsync(configuration: TrackingConfiguration): ?Promise<any> {
  if (ExponentAR.setConfigurationAsync) return ExponentAR.setConfigurationAsync(configuration);
}

export function getProvidesAudioData(): ?boolean {
  if (ExponentAR.getProvidesAudioData) return ExponentAR.getProvidesAudioData();
}

export function setProvidesAudioData(providesAudioData: boolean) {
  if (ExponentAR.setProvidesAudioData) ExponentAR.setProvidesAudioData(providesAudioData);
}

export function setPlaneDetection(planeDetection: PlaneDetection) {
  if (ExponentAR.setPlaneDetection) ExponentAR.setPlaneDetection(planeDetection);
}

export function getCameraTexture(): ?number {
  if (ExponentAR.getCameraTexture) return ExponentAR.getCameraTexture();
}

export function getPlaneDetection(): ?PlaneDetection {
  if (ExponentAR.getPlaneDetection) return ExponentAR.getPlaneDetection();
}

export function setWorldOriginAsync(matrix_float4x4: Matrix): ?Promise<any> {
  if (ExponentAR.setWorldOriginAsync) return ExponentAR.setWorldOriginAsync(matrix_float4x4);
}

export function setLightEstimationEnabled(isLightEstimationEnabled: boolean) {
  if (ExponentAR.setLightEstimationEnabled)
    ExponentAR.setLightEstimationEnabled(isLightEstimationEnabled);
}

export function getLightEstimationEnabled(): ?boolean {
  if (ExponentAR.getLightEstimationEnabled) return ExponentAR.getLightEstimationEnabled();
}

export function setAutoFocusEnabled(isAutoFocusEnabled: boolean) {
  if (ExponentAR.setAutoFocusEnabled) ExponentAR.setAutoFocusEnabled(isAutoFocusEnabled);
}

export function getAutoFocusEnabled(): ?boolean {
  if (ExponentAR.getAutoFocusEnabled) return ExponentAR.getAutoFocusEnabled();
}

export function setWorldAlignment(worldAlignment: WorldAlignment) {
  if (ExponentAR.setWorldAlignment) ExponentAR.setWorldAlignment(worldAlignment);
}

export function getWorldAlignment(): ?WorldAlignment {
  if (ExponentAR.getWorldAlignment) return ExponentAR.getWorldAlignment();
}

export function isConfigurationAvailable(configuration: TrackingConfiguration): boolean {
  const { width, height } = Dimensions.get('window');
  const isX = (width === 812 || height === 812) && !Platform.isTVOS && !Platform.isPad;
  if (configuration === TrackingConfigurations.Face && isX && isAvailable()) {
    return true;
  }
  return !!ExponentAR[configuration];
}

export function getSupportedVideoFormats(configuration: TrackingConfiguration): ?VideoFormat {
  const videoFormats = {
    [TrackingConfigurations.World]: 'WorldTrackingVideoFormats',
    [TrackingConfigurations.Orientation]: 'OrientationTrackingVideoFormats',
    [TrackingConfigurations.Face]: 'FaceTrackingVideoFormats',
  };
  const videoFormat = videoFormats[configuration];
  return ExponentAR[videoFormat];
}

export function isFrontCameraAvailable(): boolean {
  return isConfigurationAvailable(TrackingConfigurations.Face);
}

export function isRearCameraAvailable(): boolean {
  return isConfigurationAvailable(TrackingConfigurations.World);
}
