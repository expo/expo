import { Dimensions, Platform } from 'react-native';
import { NativeAR } from '../NativeAR';
import { TrackingConfiguration } from '../commons';
/**
 * Get WebGLTexture that camera device is rendering it's preview to.
 */
export async function getCameraTextureAsync() {
    const capturedCameraTexture = await NativeAR.getCameraTextureAsync();
    return new WebGLTexture(capturedCameraTexture);
}
/**
 * @only iOS
 *
 * Check whether provided configuration is valid on device.
 * @param configuration {@link TrackingConfiguration}
 */
export function isConfigurationAvailable(configuration) {
    const { width, height } = Dimensions.get('window');
    // @ts-ignore: re-evaluate this for the new iPhones (2018)
    const isX = (width === 812 || height === 812) && !Platform.isTVOS && !Platform.isPad;
    if (configuration === TrackingConfiguration.Face && isX) {
        return true;
    }
    return !!NativeAR[configuration];
}
/**
 * Checks whether front camera is available for AR processing.
 */
export function isFrontCameraAvailable() {
    return isConfigurationAvailable(TrackingConfiguration.Face);
}
/**
 * Checks whether rear caemra is avavilable for AR processing.
 */
export function isRearCameraAvailable() {
    return isConfigurationAvailable(TrackingConfiguration.World);
}
/**
 * @only iOS
 *
 * Defines motion and scene tracking behaviors for the session.
 * @param configuration {@link TrackingConfiguration}.
 * https://developer.apple.com/documentation/arkit/arconfiguration
 */
export async function setConfigurationAsync(configuration) {
    await NativeAR.setConfigurationAsync(configuration);
}
/**
 * Options for whether and how AR detects flat surfaces in captured images.
 * @iOS ARKit
 * https://developer.apple.com/documentation/arkit/arplanedetection
 *
 * @Android ARCore
 * https://developers.google.com/ar/reference/java/com/google/ar/core/Config.PlaneFindingMode
 */
export var PlaneDetection;
(function (PlaneDetection) {
    /**
     * No plane detection is run.
     */
    PlaneDetection["None"] = "none";
    /**
     * Plane detection determines horizontal planes in the scene.
     */
    PlaneDetection["Horizontal"] = "horizontal";
    /**
     * Plane detection determines vertical planes in the scene.
     */
    PlaneDetection["Vertical"] = "vertical";
    /**
     * @only Android
     * Detection both horizontal and vertical planes.
     */
    PlaneDetection["HorizontalAndVertical"] = "horizontal_and_vertical";
})(PlaneDetection || (PlaneDetection = {}));
/**
 * Choose plane detection mode.
 * @param planeDetection {@link PlaneDetection}
 */
export async function setPlaneDetectionAsync(planeDetection) {
    return NativeAR.setPlaneDetectionAsync(planeDetection);
}
/**
 * Get current plane detection mode.
 */
export function getPlaneDetection() {
    return NativeAR.getPlaneDetection();
}
/**
 * @only iOS
 *
 * @param matrix 4x4 float matrix that defines world origin
 */
export async function setWorldOriginAsync(matrix) {
    return await NativeAR.setWorldOriginAsync(matrix);
}
/**
 * @only iOS
 *
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
     * Aligns the world with gravity that is defined by the vector (0, -1, 0)
     * and heading (w.r.t. true north) that is given by the vector (0, 0, -1).
     */
    WorldAlignment["GravityAndHeading"] = "gravityAndHeading";
    /**
     * Aligns the world with the camera’s orientation.
     */
    WorldAlignment["AlignmentCamera"] = "alignmentCamera";
})(WorldAlignment || (WorldAlignment = {}));
/**
 * @only iOS
 *
 * Sets world alignment.
 * @param worldAlignment {@link WorldAlignment}
 */
export async function setWorldAlignment(worldAlignment) {
    return NativeAR.setWorldAlignment(worldAlignment);
}
/**
 * @only iOS
 *
 * Gets world alignment.
 */
export async function getWorldAlignment() {
    return NativeAR.getWorldAlignment();
}
/**
 * @only iOS
 *
 * Intructs whether to use autofocus.
 * @param isAutoFocusEnabled
 */
export async function setAutoFocusEnabled(isAutoFocusEnabled) {
    return NativeAR.setAutoFocusEnabled(isAutoFocusEnabled);
}
/**
 * @only iOS
 *
 * Checks whether autofocus is enabled.
 */
export async function getAutoFocusEnabled() {
    return NativeAR.getAutoFocusEnabled();
}
/**
 * @only iOS
 *
 * Instructs whether to enable light estimation.
 * @param isLightEstimationEnabled
 */
export async function setLightEstimationEnabled(isLightEstimationEnabled) {
    return NativeAR.setLightEstimationEnabled(isLightEstimationEnabled);
}
/**
 * @only iOS
 *
 * Checks whether light estimation is enabled.
 */
export async function getLightEstimationEnabled() {
    return NativeAR.getLightEstimationEnabled();
}
/**
 * @only iOS
 *
 * Sets whether AR should provide audio data.
 * @param providesAudioData
 */
export async function setProvidesAudioData(providesAudioData) {
    return NativeAR.setProvidesAudioData(providesAudioData);
}
/**
 * @only iOS
 *
 * Checks whether AR provides audio data.
 */
export async function getProvidesAudioData() {
    return NativeAR.getProvidesAudioData();
}
/**
 * @only iOS
 * @param configuration
 */
export function getSupportedVideoFormats(configuration) {
    const videoFormats = {
        [TrackingConfiguration.World]: 'WorldTrackingVideoFormats',
        [TrackingConfiguration.Orientation]: 'OrientationTrackingVideoFormats',
        [TrackingConfiguration.Face]: 'FaceTrackingVideoFormats',
    };
    const videoFormat = videoFormats[configuration];
    return NativeAR[videoFormat] || [];
}
//# sourceMappingURL=index.js.map