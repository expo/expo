declare global {
  class WebGLTexture {
    constructor(textureID: number);
  }
}

import {
  Dimensions,
  EmitterSubscription,
  Platform,
  findNodeHandle,
} from 'react-native';
import { Constants } from 'expo-constants';
import { EventEmitter, NativeModulesProxy } from 'expo-core';

import {
  AnchorEventType,
  EventType,
  HitTestResultType,
  PlaneDetection,
  TrackingState,
  TrackingStateReason,
  TrackingConfiguration,
  WorldAlignment,
} from './enums';
import {
  Anchor,
  ARFrameRequest,
  ARFrame,
  ARMatrices,
  DetectionImage,
  HitTest,
  Matrix,
  VideoFormat,
  Vector2,
} from './types';

const ExpoAR = NativeModulesProxy.ExpoAR;
const AREventEmitter = new EventEmitter(ExpoAR);

export function isAvailable(): boolean {
  // if (
  //   !Constants.isDevice || // Prevent Simulators
  //   Platform.isTVOS ||
  //   (Platform.OS === 'ios' && Constants.deviceYearClass < 2015) || // iOS device has A9 chip
  //   // !ExpoAR.isSupported || // ARKit is included in the build
  //   !ExpoAR.startAsync // Older SDK versions (27 and lower) that are fully compatible
  // ) {
  //   console.log('AR.isAvailable: false');
  //   return false;
  // }

  return true;
}

const AvailabilityErrorMessages = {
  Simulator: `Cannot run EXGL in a simulator`,
  ANineChip: `ARKit can only run on iOS devices with A9 (2015) or greater chips! This is a`,
  ARKitOnlyOnIOS: `ARKit can only run on an iOS device! This is a`,
};

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

export function onFrameDidUpdate(listener: (event: {}) => void): EmitterSubscription {
  return _addListener(EventType.FrameDidUpdate, listener);
}

export function onDidFailWithError(listener: (event: { error: Error }) => void): EmitterSubscription {
  return _addListener(EventType.DidFailWithError, listener);
}

export function onAnchorsDidUpdate(listener: (event: { eventType: AnchorEventType; anchors: Anchor[] }) => void): EmitterSubscription {
  return _addListener(EventType.AnchorsDidUpdate, listener);
}

export function onCameraDidChangeTrackingState(listener: (event: { trackingState: TrackingState, trackingStateReason: TrackingStateReason }) => void): EmitterSubscription {
  return _addListener(EventType.CameraDidChangeTrackingState, listener);
}

export function onSessionWasInterrupted(listener: (event: {}) => void): EmitterSubscription {
  return _addListener(EventType.SessionWasInterrupted, listener);
}

export function onSessionInterruptionEnded(listener: (event: {}) => void): EmitterSubscription {
  return _addListener(EventType.SessionInterruptionEnded, listener);
}

function _addListener(eventType: EventType, event: (...args: any[]) => void): EmitterSubscription {
  return AREventEmitter.addListener(eventType as any, event);
}

export function removeAllListeners(eventType?: EventType): void {
  AREventEmitter.removeAllListeners(eventType as any);
}

// TODO: support multiple types (take an array or bit flags)
export async function performHitTest(point: Vector2, types: HitTestResultType): Promise<HitTest[]> {
  return ExpoAR.performHitTest(point, types);
}

export async function setDetectionImagesAsync(images: { [name: string]: DetectionImage }): Promise<void> {
  return ExpoAR.setDetectionImagesAsync(images);
}

export async function getCurrentFrameAsync(attributes?: ARFrameRequest): Promise<ARFrame> {
  return ExpoAR.getCurrentFrameAsync(attributes);
}

export async function getMatricesAsync(near: number, far: number): Promise<ARMatrices> {
  return ExpoAR.getMatricesAsync(near, far);
}

export async function stopAsync(): Promise<void> {
  return ExpoAR.stopAsync();
}

/**
 * Start AR session
 */
export async function startAsync(
  node: number | React.Component,
  configuration: TrackingConfiguration
): Promise<{ capturedImageTexture: number }> {
  if (typeof node === 'number') {
    return ExpoAR.startAsync(node, configuration);
  } else {
    const handle = findNodeHandle(node);
    if (handle === null) {
      throw new Error(`Could not find the React node handle for the AR component: ${node}`);
    }
    return ExpoAR.startAsync(handle, configuration);
  }
}

export function reset() {
  ExpoAR.reset();
}

export function resume() {
  ExpoAR.resume();
}

export function pause() {
  ExpoAR.pause();
}

export async function setConfigurationAsync(configuration: TrackingConfiguration): Promise<void> {
  await ExpoAR.setConfigurationAsync(configuration);
}

export function getProvidesAudioData(): boolean {
  return ExpoAR.getProvidesAudioData();
}

export function setProvidesAudioData(providesAudioData: boolean): void {
  ExpoAR.setProvidesAudioData(providesAudioData);
}

export async function setPlaneDetectionAsync(planeDetection: PlaneDetection): Promise<void> {
  return ExpoAR.setPlaneDetectionAsync(planeDetection);
}

export function getPlaneDetection(): PlaneDetection {
  return ExpoAR.getPlaneDetection();
}

export async function getCameraTextureAsync(): Promise<WebGLTexture> {
  const capturedCameraTexture = await ExpoAR.getCameraTextureAsync();
  return new WebGLTexture(capturedCameraTexture);
}

export async function setWorldOriginAsync(matrix_float4x4: Matrix): Promise<void> {
  await ExpoAR.setWorldOriginAsync(matrix_float4x4);
}

export function setLightEstimationEnabled(isLightEstimationEnabled: boolean) {
  ExpoAR.setLightEstimationEnabled(isLightEstimationEnabled);
}

export function getLightEstimationEnabled(): boolean {
  return ExpoAR.getLightEstimationEnabled();
}

export function setAutoFocusEnabled(isAutoFocusEnabled: boolean): void {
  ExpoAR.setAutoFocusEnabled(isAutoFocusEnabled);
}

export function getAutoFocusEnabled(): boolean {
  return ExpoAR.getAutoFocusEnabled();
}

export function setWorldAlignment(worldAlignment: WorldAlignment): void {
  ExpoAR.setWorldAlignment(worldAlignment);
}

export function getWorldAlignment(): WorldAlignment {
  return ExpoAR.getWorldAlignment();
}

export function isConfigurationAvailable(configuration: TrackingConfiguration): boolean {
  const { width, height } = Dimensions.get('window');
  // @ts-ignore: re-evaluate this for the new iPhones (2018)
  const isX = (width === 812 || height === 812) && !Platform.isTVOS && !Platform.isPad;
  if (configuration === TrackingConfiguration.Face && isX && isAvailable()) {
    return true;
  }
  return !!ExpoAR[configuration];
}

export function getSupportedVideoFormats(configuration: TrackingConfiguration): VideoFormat[] {
  const videoFormats = {
    [TrackingConfiguration.World]: 'WorldTrackingVideoFormats',
    [TrackingConfiguration.Orientation]: 'OrientationTrackingVideoFormats',
    [TrackingConfiguration.Face]: 'FaceTrackingVideoFormats',
  };
  const videoFormat = videoFormats[configuration];
  return ExpoAR[videoFormat] || [];
}

export function isFrontCameraAvailable(): boolean {
  return isConfigurationAvailable(TrackingConfiguration.Face);
}

export function isRearCameraAvailable(): boolean {
  return isConfigurationAvailable(TrackingConfiguration.World);
}

export function getVersion(): string {
  return ExpoAR.ARKitVersion;
}
