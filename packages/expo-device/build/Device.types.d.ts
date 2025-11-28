/**
 * An enum representing the different types of devices supported by Expo.
 */
export declare enum DeviceType {
    /**
     * An unrecognized device type.
     */
    UNKNOWN = 0,
    /**
     * Mobile phone handsets, typically with a touch screen and held in one hand.
     */
    PHONE = 1,
    /**
     * Tablet computers, typically with a touch screen that is larger than a usual phone.
     */
    TABLET = 2,
    /**
     * Desktop or laptop computers, typically with a keyboard and mouse.
     */
    DESKTOP = 3,
    /**
     * Device with TV-based interfaces.
     */
    TV = 4
}
/**
 * Represents a rectangle describing a camera cutout.
 * @platform android
 * @platform ios
 */
export interface CameraRect {
    x: number;
    y: number;
    width: number;
    height: number;
    radius?: number | null;
}
/**
 * Represents the camera cutout information.
 * @platform android
 * @platform ios
 */
export interface CameraCutoutInfo {
    hasCameraCutout: boolean;
    cameraRects: CameraRect[];
    safeInsets: {
        top: number;
        bottom: number;
        left: number;
        right: number;
    };
    type?: 'hole' | 'pill' | 'wide' | 'unknown';
}
//# sourceMappingURL=Device.types.d.ts.map