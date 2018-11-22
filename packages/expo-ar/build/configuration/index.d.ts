declare global {
    class WebGLTexture {
        constructor(textureID: number);
    }
}
import { TrackingConfiguration, Matrix4x4, Size } from '../commons';
/**
 * Get WebGLTexture that camera device is rendering it's preview to.
 */
export declare function getCameraTextureAsync(): Promise<WebGLTexture>;
/**
 * @only iOS
 *
 * Check whether provided configuration is valid on device.
 * @param configuration {@link TrackingConfiguration}
 */
export declare function isConfigurationAvailable(configuration: TrackingConfiguration): boolean;
/**
 * Checks whether front camera is available for AR processing.
 */
export declare function isFrontCameraAvailable(): boolean;
/**
 * Checks whether rear caemra is avavilable for AR processing.
 */
export declare function isRearCameraAvailable(): boolean;
/**
 * @only iOS
 *
 * Defines motion and scene tracking behaviors for the session.
 * @param configuration {@link TrackingConfiguration}.
 * https://developer.apple.com/documentation/arkit/arconfiguration
 */
export declare function setConfigurationAsync(configuration: TrackingConfiguration): Promise<void>;
/**
 * Options for whether and how AR detects flat surfaces in captured images.
 * @iOS ARKit
 * https://developer.apple.com/documentation/arkit/arplanedetection
 *
 * @Android ARCore
 * https://developers.google.com/ar/reference/java/com/google/ar/core/Config.PlaneFindingMode
 */
export declare enum PlaneDetection {
    /**
     * No plane detection is run.
     */
    None = "none",
    /**
     * Plane detection determines horizontal planes in the scene.
     */
    Horizontal = "horizontal",
    /**
     * Plane detection determines vertical planes in the scene.
     */
    Vertical = "vertical",
    /**
     * @only Android
     * Detection both horizontal and vertical planes.
     */
    HorizontalAndVertical = "horizontal_and_vertical"
}
/**
 * Choose plane detection mode.
 * @param planeDetection {@link PlaneDetection}
 */
export declare function setPlaneDetectionAsync(planeDetection: PlaneDetection): Promise<void>;
/**
 * Get current plane detection mode.
 */
export declare function getPlaneDetection(): Promise<PlaneDetection>;
/**
 * @only iOS
 *
 * @param matrix 4x4 float matrix that defines world origin
 */
export declare function setWorldOriginAsync(matrix: Matrix4x4): Promise<void>;
/**
 * @only iOS
 *
 * Options for how ARKit constructs a scene coordinate system based on real-world device motion.
 * https://developer.apple.com/documentation/arkit/arworldalignment
 */
export declare enum WorldAlignment {
    /**
     * Aligns the world with gravity that is defined by vector (0, -1, 0).
     */
    Gravity = "gravity",
    /**
     * Aligns the world with gravity that is defined by the vector (0, -1, 0)
     * and heading (w.r.t. true north) that is given by the vector (0, 0, -1).
     */
    GravityAndHeading = "gravityAndHeading",
    /**
     * Aligns the world with the camera’s orientation.
     */
    AlignmentCamera = "alignmentCamera"
}
/**
 * @only iOS
 *
 * Sets world alignment.
 * @param worldAlignment {@link WorldAlignment}
 */
export declare function setWorldAlignment(worldAlignment: WorldAlignment): Promise<void>;
/**
 * @only iOS
 *
 * Gets world alignment.
 */
export declare function getWorldAlignment(): Promise<WorldAlignment>;
/**
 * @only iOS
 *
 * Intructs whether to use autofocus.
 * @param isAutoFocusEnabled
 */
export declare function setAutoFocusEnabled(isAutoFocusEnabled: boolean): Promise<void>;
/**
 * @only iOS
 *
 * Checks whether autofocus is enabled.
 */
export declare function getAutoFocusEnabled(): Promise<boolean>;
/**
 * @only iOS
 *
 * Instructs whether to enable light estimation.
 * @param isLightEstimationEnabled
 */
export declare function setLightEstimationEnabled(isLightEstimationEnabled: boolean): Promise<void>;
/**
 * @only iOS
 *
 * Checks whether light estimation is enabled.
 */
export declare function getLightEstimationEnabled(): Promise<boolean>;
/**
 * @only iOS
 *
 * Sets whether AR should provide audio data.
 * @param providesAudioData
 */
export declare function setProvidesAudioData(providesAudioData: boolean): Promise<void>;
/**
 * @only iOS
 *
 * Checks whether AR provides audio data.
 */
export declare function getProvidesAudioData(): Promise<boolean>;
export declare type VideoFormat = {
    type: string;
    imageResolution: Size;
    framesPerSecond: number;
};
/**
 * @only iOS
 * @param configuration
 */
export declare function getSupportedVideoFormats(configuration: TrackingConfiguration): VideoFormat[];
