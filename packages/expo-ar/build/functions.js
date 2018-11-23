import { Dimensions, Platform, findNodeHandle, } from 'react-native';
import { Constants } from 'expo-constants';
import { EventEmitter, NativeModulesProxy } from 'expo-core';
import { EventType, TrackingConfiguration, } from './enums';
const ExpoAR = NativeModulesProxy.ExpoAR;
const AREventEmitter = new EventEmitter(ExpoAR);
export function isAvailable() {
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
export function getUnavailabilityReason() {
    if (!Constants.isDevice) {
        return AvailabilityErrorMessages.Simulator;
    }
    else if (Platform.OS !== 'ios') {
        return `${AvailabilityErrorMessages.ARKitOnlyOnIOS} ${Platform.OS} device`;
    }
    else if (Constants.deviceYearClass < 2015) {
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
    return AREventEmitter.addListener(eventType, event);
}
export function removeAllListeners(eventType) {
    AREventEmitter.removeAllListeners(eventType);
}
/*
 ****************************************************
 *                LIFECYCLE FUNCTIONS               *
 ****************************************************
 */
/**
 * Start AR session
 */
export async function startAsync(node, configuration) {
    if (typeof node === 'number') {
        return ExpoAR.startAsync(node, configuration);
    }
    else {
        const handle = findNodeHandle(node);
        if (handle === null) {
            throw new Error(`Could not find the React node handle for the AR component: ${node}`);
        }
        return ExpoAR.startAsync(handle, configuration);
    }
}
export async function pauseAsync() {
    return ExpoAR.pause();
}
export async function resumeAsync() {
    return ExpoAR.resume();
}
export async function resetAsync() {
    return ExpoAR.reset();
}
export async function stopAsync() {
    return ExpoAR.stopAsync();
}
/*
 ****************************************************
 *                FEATURES FUNCTIONS                *
 ****************************************************
 */
export async function getCurrentFrameAsync(attributes) {
    return ExpoAR.getCurrentFrameAsync(attributes);
}
/**
 * Performs a ray cast from the user's device in the direction of given location
 * https://developers.google.com/ar/reference/java/com/google/ar/core/Frame#hitTest(float,%20float)
 * https://developer.apple.com/documentation/arkit/arframe/2875718-hittest
 *
 * @param point Vector2 (x, y). A point in normalized screen coordinate space.
 * (The point (0,0) represents the top left corner of the screen, and the point (1,1) represents the bottom right corner.)
 * @param types iOS only, types of hit-test result to search for
 *
 * @returns a promise resolving to list of results, sorted from nearest to farthest
 */
export async function performHitTestAsync(point, types) {
    return ExpoAR.performHitTestAsync(point.x, point.y, Array.isArray(types) ? types : [types]);
}
export async function setDetectionImagesAsync(images) {
    return ExpoAR.setDetectionImagesAsync(images);
}
export async function getMatricesAsync(near, far) {
    return ExpoAR.getMatricesAsync(near, far);
}
/*
 ****************************************************
 *              CONFIGURATION FUNCTIONS             *
 ****************************************************
 */
export async function setConfigurationAsync(configuration) {
    await ExpoAR.setConfigurationAsync(configuration);
}
export function getProvidesAudioData() {
    return ExpoAR.getProvidesAudioData();
}
export function setProvidesAudioData(providesAudioData) {
    ExpoAR.setProvidesAudioData(providesAudioData);
}
export async function setPlaneDetectionAsync(planeDetection) {
    return ExpoAR.setPlaneDetectionAsync(planeDetection);
}
export function getPlaneDetection() {
    return ExpoAR.getPlaneDetection();
}
export async function getCameraTextureAsync() {
    const capturedCameraTexture = await ExpoAR.getCameraTextureAsync();
    return new WebGLTexture(capturedCameraTexture);
}
export async function setWorldOriginAsync(matrix_float4x4) {
    await ExpoAR.setWorldOriginAsync(matrix_float4x4);
}
export function setLightEstimationEnabled(isLightEstimationEnabled) {
    ExpoAR.setLightEstimationEnabled(isLightEstimationEnabled);
}
export function getLightEstimationEnabled() {
    return ExpoAR.getLightEstimationEnabled();
}
export function setAutoFocusEnabled(isAutoFocusEnabled) {
    ExpoAR.setAutoFocusEnabled(isAutoFocusEnabled);
}
export function getAutoFocusEnabled() {
    return ExpoAR.getAutoFocusEnabled();
}
export function setWorldAlignment(worldAlignment) {
    ExpoAR.setWorldAlignment(worldAlignment);
}
export function getWorldAlignment() {
    return ExpoAR.getWorldAlignment();
}
export function isConfigurationAvailable(configuration) {
    const { width, height } = Dimensions.get('window');
    // @ts-ignore: re-evaluate this for the new iPhones (2018)
    const isX = (width === 812 || height === 812) && !Platform.isTVOS && !Platform.isPad;
    if (configuration === TrackingConfiguration.Face && isX && isAvailable()) {
        return true;
    }
    return !!ExpoAR[configuration];
}
export function getSupportedVideoFormats(configuration) {
    const videoFormats = {
        [TrackingConfiguration.World]: 'WorldTrackingVideoFormats',
        [TrackingConfiguration.Orientation]: 'OrientationTrackingVideoFormats',
        [TrackingConfiguration.Face]: 'FaceTrackingVideoFormats',
    };
    const videoFormat = videoFormats[configuration];
    return ExpoAR[videoFormat] || [];
}
export function isFrontCameraAvailable() {
    return isConfigurationAvailable(TrackingConfiguration.Face);
}
export function isRearCameraAvailable() {
    return isConfigurationAvailable(TrackingConfiguration.World);
}
export function getVersion() {
    return ExpoAR.ARKitVersion;
}
//# sourceMappingURL=functions.js.map