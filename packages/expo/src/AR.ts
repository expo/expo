import { Constants } from 'expo-constants';
import * as React from 'react';
import {
  Dimensions,
  NativeEventEmitter,
  NativeModules,
  Platform,
  EmitterSubscription,
  findNodeHandle,
} from 'react-native';

const ExponentAR = NativeModules.ExponentAR || {};

const emitter = new NativeEventEmitter(ExponentAR);

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

export type Size = {
  width: number;
  height: number;
};

export type Vector3 = {
  x: number;
  y: number;
  z: number;
};

export type Vector2 = {
  x: number;
  y: number;
};

export type TextureCoordinate = {
  u: number;
  v: number;
};

export type Matrix = number[];

export type FaceGeometry = {
  vertexCount: number;
  textureCoordinateCount: number;
  triangleCount: number;
  vertices: Vector3[];
  textureCoordinates: TextureCoordinate[];
  triangleIndices: number[];
};

export type Anchor = {
  type: AnchorType;
  transform: Matrix;
  id: string;
  center?: Vector3;
  extent?: { width: number; length: number };
  image?: {
    name: string | null;
    size: Size;
  };
  geometry?: FaceGeometry;
  blendShapes?: { [shape in BlendShape]?: number };
};

export type HitTest = {
  type: number;
  distance: number;
  localTransform: number[];
  worldTransform: number[];
  anchor: Anchor;
};

export type HitTestResults = {
  hitTest: HitTest;
};

export type DetectionImage = {
  uri: string;
  width: number;
  name?: string;
};

export type ARFrameAnchorRequest = {
  ARFaceTrackingConfiguration?: {
    geometry?: boolean;
    blendShapes?: boolean | BlendShape[];
  };
};

export type ARFrameRequest = {
  anchors?: ARFrameAnchorRequest;
  rawFeaturePoints?: boolean;
  lightEstimation?: boolean;
  capturedDepthData?: boolean;
};

export type LightEstimation = {
  ambientIntensity: number;
  ambientColorTemperature: number;
  primaryLightDirection?: Vector3;
  primaryLightIntensity?: number;
};

export type RawFeaturePoint = { x: number; y: number; z: number; id: string };

export type CameraCalibrationData = {
  intrinsicMatrix: Matrix;
  intrinsicMatrixReferenceDimensions: Size;
  extrinsicMatrix: Matrix;
  pixelSize: number;
  lensDistortionLookupTable: any;
  inverseLensDistortionLookupTable: any;
  lensDistortionCenter: Vector3;
};

export type CapturedDepthData = {
  timestamp: number;
  depthDataQuality: DepthDataQuality;
  depthDataAccuracy: DepthDataAccuracy;
  depthDataFiltered: boolean;
  cameraCalibrationData: CameraCalibrationData;
};

export type ARFrame = {
  timestamp: number;
  anchors?: Anchor[] | null;
  rawFeaturePoints?: RawFeaturePoint[] | null;
  lightEstimation?: LightEstimation | null;
  capturedDepthData?: CapturedDepthData | null;
};

export type ARMatrices = {
  transform: Matrix;
  viewMatrix: Matrix;
  projectionMatrix: Matrix;
};

type ARStartResult = {
  capturedImageTexture: number;
};

type ReactNativeNodeHandle = number;

export type ImageResolution = {
  width: number;
  height: number;
};

export type VideoFormat = {
  type: string;
  imageResolution: ImageResolution;
  framesPerSecond: number;
};

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
   * Plane detection determines horizontal planes in the scene
   */
  Vertical = 'vertical',
}

/**
 * Hit-Test Result Types
 * Possible types for specifying a hit-test search, or for the result of a hit-test search.
 * https://developer.apple.com/documentation/arkit/arhittestresulttype
 */
export enum HitTestResultTypes {
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
  FrameDidUpdate = ExponentAR.frameDidUpdate,
  DidFailWithError = ExponentAR.didFailWithError,
  AnchorsDidUpdate = ExponentAR.anchorsDidUpdate,
  CameraDidChangeTrackingState = ExponentAR.cameraDidChangeTrackingState,
  SessionWasInterrupted = ExponentAR.sessionWasInterrupted,
  SessionInterruptionEnded = ExponentAR.sessionInterruptionEnded,
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

type FrameDidUpdateEvent = {};

type DidFailWithErrorEvent = { error: Error };

type AnchorsDidUpdateEvent = {
  eventType: AnchorEventType;
  anchors: Anchor[];
};

type CameraDidChangeTrackingStateEvent = {
  trackingState: TrackingState;
  trackingStateReason: TrackingStateReason;
};

type SessionWasInterruptedEvent = {};

type SessionInterruptionEndedEvent = {};

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
    // @ts-ignore
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

export function onFrameDidUpdate(
  listener: (event: FrameDidUpdateEvent) => void
): EmitterSubscription {
  return _addListener(EventType.FrameDidUpdate, listener);
}

export function onDidFailWithError(
  listener: (event: DidFailWithErrorEvent) => void
): EmitterSubscription {
  return _addListener(EventType.DidFailWithError, listener);
}

export function onAnchorsDidUpdate(
  listener: (event: AnchorsDidUpdateEvent) => void
): EmitterSubscription {
  return _addListener(EventType.AnchorsDidUpdate, listener);
}

export function onCameraDidChangeTrackingState(
  listener: (event: CameraDidChangeTrackingStateEvent) => void
): EmitterSubscription {
  return _addListener(EventType.CameraDidChangeTrackingState, listener);
}

export function onSessionWasInterrupted(
  listener: (event: SessionWasInterruptedEvent) => void
): EmitterSubscription {
  return _addListener(EventType.SessionWasInterrupted, listener);
}

export function onSessionInterruptionEnded(
  listener: (event: SessionInterruptionEndedEvent) => void
): EmitterSubscription {
  return _addListener(EventType.SessionInterruptionEnded, listener);
}

function _addListener(eventType: EventType, event: (...args: any[]) => void): EmitterSubscription {
  return emitter.addListener(eventType as any, event);
}

export function removeAllListeners(eventType?: EventType): void {
  emitter.removeAllListeners(eventType as any);
}

// TODO: support multiple types (take an array or bit flags)
export function performHitTest(point: Vector2, types: HitTestResultTypes): HitTestResults {
  if (ExponentAR.performHitTest) {
    return ExponentAR.performHitTest(point, types);
  }
  throw new Error(`AR hit testing is not supported on this device`);
}

export async function setDetectionImagesAsync(images: {
  [name: string]: DetectionImage;
}): Promise<void> {
  if (ExponentAR.setDetectionImagesAsync) {
    await ExponentAR.setDetectionImagesAsync(images);
  }
}

export function getCurrentFrame(attributes?: ARFrameRequest): ARFrame {
  if (ExponentAR.getCurrentFrame) {
    return ExponentAR.getCurrentFrame(attributes);
  }
  throw new Error(`AR is not supported on this device`);
}

export function getARMatrices(near: number, far: number): ARMatrices {
  if (ExponentAR.getARMatrices) {
    return ExponentAR.getARMatrices(near, far);
  }
  throw new Error(`AR is not supported on this device`);
}

export async function stopAsync(): Promise<void> {
  if (ExponentAR.stopAsync) {
    await ExponentAR.stopAsync();
  }
}

export async function startAsync(
  node: ReactNativeNodeHandle | React.Component,
  configuration: TrackingConfiguration
): Promise<ARStartResult> {
  let handle = typeof node === 'number' ? node : _getNodeHandle(node);
  if (ExponentAR.startAsync) {
    return await ExponentAR.startAsync(handle, configuration);
  }
  throw new Error(`AR is not supported on this device`);
}

function _getNodeHandle(component: React.Component): ReactNativeNodeHandle {
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

export async function setConfigurationAsync(configuration: TrackingConfiguration): Promise<void> {
  if (ExponentAR.setConfigurationAsync) {
    await ExponentAR.setConfigurationAsync(configuration);
  }
}

export function getProvidesAudioData(): boolean {
  if (ExponentAR.getProvidesAudioData) {
    return ExponentAR.getProvidesAudioData();
  }
  return false;
}

export function setProvidesAudioData(providesAudioData: boolean): void {
  if (ExponentAR.setProvidesAudioData) {
    ExponentAR.setProvidesAudioData(providesAudioData);
  }
}

export function setPlaneDetection(planeDetection: PlaneDetection): void {
  if (ExponentAR.setPlaneDetection) {
    ExponentAR.setPlaneDetection(planeDetection);
  }
}

export function getPlaneDetection(): PlaneDetection {
  if (ExponentAR.getPlaneDetection) {
    return ExponentAR.getPlaneDetection();
  }
  throw new Error(`AR plane detection is not supported on this device`);
}

export function getCameraTexture(): number {
  if (ExponentAR.getCameraTexture) {
    return ExponentAR.getCameraTexture();
  }
  throw new Error(`AR camera textures are not supported on this device`);
}

export async function setWorldOriginAsync(matrix_float4x4: Matrix): Promise<void> {
  if (ExponentAR.setWorldOriginAsync) {
    await ExponentAR.setWorldOriginAsync(matrix_float4x4);
  }
}

export function setLightEstimationEnabled(isLightEstimationEnabled: boolean) {
  if (ExponentAR.setLightEstimationEnabled) {
    ExponentAR.setLightEstimationEnabled(isLightEstimationEnabled);
  }
}

export function getLightEstimationEnabled(): boolean {
  if (ExponentAR.getLightEstimationEnabled) {
    return ExponentAR.getLightEstimationEnabled();
  }
  return false;
}

export function setAutoFocusEnabled(isAutoFocusEnabled: boolean): void {
  if (ExponentAR.setAutoFocusEnabled) {
    ExponentAR.setAutoFocusEnabled(isAutoFocusEnabled);
  }
}

export function getAutoFocusEnabled(): boolean {
  if (ExponentAR.getAutoFocusEnabled) {
    return ExponentAR.getAutoFocusEnabled();
  }
  return false;
}

export function setWorldAlignment(worldAlignment: WorldAlignment): void {
  if (ExponentAR.setWorldAlignment) {
    ExponentAR.setWorldAlignment(worldAlignment);
  }
}

export function getWorldAlignment(): WorldAlignment {
  if (ExponentAR.getWorldAlignment) {
    return ExponentAR.getWorldAlignment();
  }
  throw new Error(`AR world alignment is not supported on this device`);
}

export function isConfigurationAvailable(configuration: TrackingConfiguration): boolean {
  const { width, height } = Dimensions.get('window');
  // @ts-ignore: re-evaluate this for the new iPhones (2018)
  const isX = (width === 812 || height === 812) && !Platform.isTVOS && !Platform.isPad;
  if (configuration === TrackingConfiguration.Face && isX && isAvailable()) {
    return true;
  }
  return !!ExponentAR[configuration];
}

export function getSupportedVideoFormats(configuration: TrackingConfiguration): VideoFormat[] {
  const videoFormats = {
    [TrackingConfiguration.World]: 'WorldTrackingVideoFormats',
    [TrackingConfiguration.Orientation]: 'OrientationTrackingVideoFormats',
    [TrackingConfiguration.Face]: 'FaceTrackingVideoFormats',
  };
  const videoFormat = videoFormats[configuration];
  return ExponentAR[videoFormat] || [];
}

export function isFrontCameraAvailable(): boolean {
  return isConfigurationAvailable(TrackingConfiguration.Face);
}

export function isRearCameraAvailable(): boolean {
  return isConfigurationAvailable(TrackingConfiguration.World);
}
