import {
  PermissionResponse,
  PermissionStatus,
  PermissionExpiration,
  PermissionHookOptions,
} from 'expo-modules-core';
import { Ref } from 'react';
import type { ViewProps } from 'react-native';

export type CameraType = 'front' | 'back';

export type FlashMode = 'off' | 'on' | 'auto';

export type ImageType = 'png' | 'jpg';

export type CameraMode = 'picture' | 'video';

/**
 * This option specifies the mode of focus on the device.
 * - `on` - Indicates that the device should autofocus once and then lock the focus.
 * - `off` - Indicates that the device should automatically focus when needed.
 * @default off
 */
export type FocusMode = 'on' | 'off';

/**
 * This option specifies what codec to use when recording a video.
 * @platform ios
 */
export type VideoCodec = 'avc1' | 'hvc1' | 'jpeg' | 'apcn' | 'ap4h';

/**
 * This option specifies the stabilization mode to use when recording a video.
 * @platform ios
 */
export type VideoStabilization = 'off' | 'standard' | 'cinematic' | 'auto';

// @docsMissing
export type VideoQuality = '2160p' | '1080p' | '720p' | '480p' | '4:3';

export type CameraOrientation =
  | 'portrait'
  | 'portraitUpsideDown'
  | 'landscapeLeft'
  | 'landscapeRight';

// @docsMissing
/**
 * @hidden We do not expose related web methods in docs.
 * @platform web
 */
export type ImageSize = {
  width: number;
  height: number;
};

// @docsMissing
/**
 * @hidden We do not expose related web methods in docs.
 * @platform web
 */
export type WebCameraSettings = {
  autoFocus?: string;
  flashMode?: string;
  whiteBalance?: string;
  exposureCompensation?: number;
  colorTemperature?: number;
  iso?: number;
  brightness?: number;
  contrast?: number;
  saturation?: number;
  sharpness?: number;
  focusDistance?: number;
  zoom?: number;
};

// @needsAudit
export type CameraCapturedPicture = {
  /**
   * Captured image width.
   */
  width: number;
  /**
   * Captured image height.
   */
  height: number;
  /**
   * On web, the value of `uri` is the same as `base64` because file system URLs are not supported in the browser.
   */
  uri: string;
  /**
   * A Base64 representation of the image.
   */
  base64?: string;
  /**
   * On Android and iOS this object may include various fields based on the device and operating system.
   * On web, it is a partial representation of the [`MediaTrackSettings`](https://developer.mozilla.org/en-US/docs/Web/API/MediaTrackSettings) dictionary.
   */
  exif?: Partial<MediaTrackSettings> | any;
};

// @needsAudit
export type CameraPictureOptions = {
  /**
   * Specify the compression quality from `0` to `1`. `0` means compress for small size, and `1` means compress for maximum quality.
   */
  quality?: number;
  /**
   * Whether to also include the image data in Base64 format.
   */
  base64?: boolean;
  /**
   * Whether to also include the EXIF data for the image.
   */
  exif?: boolean;
  /**
   * Additional EXIF data to be included for the image. Only useful when `exif` option is set to `true`.
   * @platform android
   * @platform ios
   */
  additionalExif?: Record<string, any>;
  /**
   * A callback invoked when picture is saved. If set, the promise of this method will resolve immediately with no data after picture is captured.
   * The data that it should contain will be passed to this callback. If displaying or processing a captured photo right after taking it
   * is not your case, this callback lets you skip waiting for it to be saved.
   * @param picture
   */
  onPictureSaved?: (picture: CameraCapturedPicture) => void;
  // TODO(Bacon): Is it possible to implement this in the browser?
  /**
   * If set to `true`, camera skips orientation adjustment and returns an image straight from the device's camera.
   * If enabled, `quality` option is discarded (processing pipeline is skipped as a whole).
   * Although enabling this option reduces image delivery time significantly, it may cause the image to appear in a wrong orientation
   * in the `Image` component (at the time of writing, it does not respect EXIF orientation of the images).
   * > **Note**: Enabling `skipProcessing` would cause orientation uncertainty. `Image` component does not respect EXIF
   * > stored orientation information, that means obtained image would be displayed wrongly (rotated by 90°, 180° or 270°).
   * > Different devices provide different orientations. For example some Sony Xperia or Samsung devices don't provide
   * > correctly oriented images by default. To always obtain correctly oriented image disable `skipProcessing` option.
   */
  skipProcessing?: boolean;
  /**
   * @platform web
   */
  scale?: number;
  /**
   * @platform web
   */
  imageType?: ImageType;
  /**
   * @platform web
   */
  isImageMirror?: boolean;
  /**
   * @hidden
   */
  id?: number;
  /**
   * @hidden
   */
  fastMode?: boolean;
  /**
   * @hidden
   */
  maxDownsampling?: number;
};

// @needsAudit
export type CameraRecordingOptions = {
  /**
   * Maximum video duration in seconds.
   */
  maxDuration?: number;
  /**
   * Maximum video file size in bytes.
   */
  maxFileSize?: number;
  /**
   * If `true`, the recorded video will be flipped along the vertical axis. iOS flips videos recorded with the front camera by default,
   * but you can reverse that back by setting this to `true`. On Android, this is handled in the user's device settings.
   * @platform ios
   */
  mirror?: boolean;
  /**
   * This option specifies what codec to use when recording the video. See [`VideoCodec`](#videocodec) for the possible values.
   * @platform ios
   */
  codec?: VideoCodec;
};

/**
 * @hidden
 */
export type PictureSavedListener = (event: {
  nativeEvent: { data: CameraCapturedPicture; id: number };
}) => void;

/**
 * @hidden
 */
export type CameraReadyListener = () => void;

/**
 * @hidden
 */
export type ResponsiveOrientationChangedListener = (event: {
  nativeEvent: ResponsiveOrientationChanged;
}) => void;

export type ResponsiveOrientationChanged = { orientation: CameraOrientation };

/**
 * @hidden
 */
export type MountErrorListener = (event: { nativeEvent: CameraMountError }) => void;

// @docsMissing
export type CameraMountError = { message: string };

// @docsMissing
export type Point = {
  x: number;
  y: number;
};

export type BarcodeSize = {
  /**
   * The height value.
   */
  height: number;
  /**
   * The width value.
   */
  width: number;
};

/**
 * These coordinates are represented in the coordinate space of the camera source (e.g. when you
 * are using the camera view, these values are adjusted to the dimensions of the view).
 */
export type BarcodePoint = Point;

export type BarcodeBounds = {
  /**
   * The origin point of the bounding box.
   */
  origin: BarcodePoint;
  /**
   * The size of the bounding box.
   */
  size: BarcodeSize;
};

// @needsAudit
export type BarcodeScanningResult = {
  /**
   * The barcode type.
   */
  type: string;
  /**
   * The parsed information encoded in the barcode.
   */
  data: string;
  /**
   * The raw information encoded in the barcode.
   * May be different from `data` depending on the barcode type.
   * @platform android
   * @hidden
   */
  raw?: string;
  /**
   * Corner points of the bounding box.
   * `cornerPoints` is not always available and may be empty. On iOS, for `code39` and `pdf417`
   * you don't get this value.
   */
  cornerPoints: BarcodePoint[];
  /**
   * The [BarcodeBounds](#barcodebounds) object.
   * `bounds` in some case will be representing an empty rectangle.
   * Moreover, `bounds` doesn't have to bound the whole barcode.
   * For some types, they will represent the area used by the scanner.
   */
  bounds: BarcodeBounds;
};

export type ScanningResult = Omit<BarcodeScanningResult, 'bounds'>;

// @needsAudit
export type CameraProps = ViewProps & {
  /**
   * Camera facing. Use one of `CameraType`. When `front`, use the front-facing camera.
   * When `back`, use the back-facing camera.
   * @default 'back'
   */
  facing?: CameraType;
  /**
   * Camera flash mode. Use one of `FlashMode` values. When `on`, the flash on your device will
   * turn on when taking a picture. When `off`, it won't. Setting it to `auto` will fire flash if required.
   * @default 'off'
   */
  flash?: FlashMode;
  /**
   * A value between `0` and `1` being a percentage of device's max zoom. `0` - not zoomed, `1` - maximum zoom.
   * @default 0
   */
  zoom?: number;
  /**
   * Used to select image or video output
   * @default 'picture'
   */
  mode?: CameraMode;
  /**
   * If present, video will be recorded with no sound.
   * @default false
   */
  mute?: boolean;
  /**
   * Indicates the focus mode to use.
   * @default off
   * @platform ios
   */
  autofocus?: FocusMode;
  /**
   * Specify the quality of the recorded video. Use one of `VideoQuality` possible values:
   * for 16:9 resolution `2160p`, `1080p`, `720p`, `480p` : `Android only` and for 4:3 `4:3` (the size is 640x480).
   * If the chosen quality is not available for a device, the highest available is chosen.
   */
  videoQuality?: VideoQuality;
  /**
   * A boolean that determines whether the camera shutter animation should be enabled.
   * @default true
   */
  animateShutter?: boolean;
  /**
   * A string representing the size of pictures [`takePictureAsync`](#takepictureasync) will take.
   * Available sizes can be fetched with [`getAvailablePictureSizes`](#getavailablepicturesizes).
   */
  pictureSize?: string;
  /**
   * A boolean to enable or disable the torch
   * @default false
   */
  enableTorch?: boolean;
  /**
   * Callback invoked when camera preview has been set.
   */
  onCameraReady?: () => void;
  /**
   * The video stabilization mode used for a video recording. Use one of [`VideoStabilization.<value>`](#videostabilization).
   * You can read more about each stabilization type in [Apple Documentation](https://developer.apple.com/documentation/avfoundation/avcapturevideostabilizationmode).
   * @platform ios
   */
  videoStabilizationMode?: VideoStabilization;
  /**
   * Callback invoked when camera preview could not been started.
   * @param event Error object that contains a `message`.
   */
  onMountError?: (event: CameraMountError) => void;
  /**
   * @example
   * ```tsx
   * <CameraView
   *   barcodeScannerSettings={{
   *     barcodeTypes: ["qr"],
   *   }}
   * />
   * ```
   */
  barcodeScannerSettings?: BarcodeSettings;
  /**
   * Callback that is invoked when a barcode has been successfully scanned. The callback is provided with
   * an object of the [`BarcodeScanningResult`](#barcodescanningresult) shape, where the `type`
   * refers to the barcode type that was scanned and the `data` is the information encoded in the barcode
   * (in this case of QR codes, this is often a URL). See [`BarcodeType`](#barcodetype) for supported values.
   * for supported values.
   * @param scanningResult
   */
  onBarcodeScanned?: (scanningResult: BarcodeScanningResult) => void;
  /**
   * A URL for an image to be shown while the camera is loading.
   * @platform web
   */
  poster?: string;
  /**
   * Whether to allow responsive orientation of the camera when the screen orientation is locked (i.e. when set to `true`
   * landscape photos will be taken if the device is turned that way, even if the app or device orientation is locked to portrait)
   * @platform ios
   */
  responsiveOrientationWhenOrientationLocked?: boolean;
  /**
   * Callback invoked when responsive orientation changes. Only applicable if `responsiveOrientationWhenOrientationLocked` is `true`
   * @param event result object that contains updated orientation of camera
   * @platform ios
   */
  onResponsiveOrientationChanged?: (event: ResponsiveOrientationChanged) => void;
};

/**
 * @hidden
 */
export interface CameraViewRef {
  readonly takePicture: (options: CameraPictureOptions) => Promise<CameraCapturedPicture>;
  readonly getAvailablePictureSizes: () => Promise<string[]>;
  readonly record: (options?: CameraRecordingOptions) => Promise<{ uri: string }>;
  readonly stopRecording: () => Promise<void>;
  readonly launchModernScanner: () => Promise<void>;
}

/**
 * @hidden
 */
export type CameraNativeProps = {
  pointerEvents?: any;
  style?: any;
  ref?: Ref<CameraViewRef>;
  onCameraReady?: CameraReadyListener;
  onMountError?: MountErrorListener;
  onBarcodeScanned?: (event: { nativeEvent: BarcodeScanningResult }) => void;
  onPictureSaved?: PictureSavedListener;
  onResponsiveOrientationChanged?: ResponsiveOrientationChangedListener;
  facing?: string;
  flashMode?: string;
  enableTorch?: boolean;
  animateShutter?: boolean;
  autoFocus?: FocusMode;
  mute?: boolean;
  zoom?: number;
  barcodeScannerSettings?: BarcodeSettings;
  barcodeScannerEnabled?: boolean;
  poster?: string;
  responsiveOrientationWhenOrientationLocked?: boolean;
};

// @docsMissing
export type BarcodeSettings = {
  barcodeTypes: BarcodeType[];
};

/**
 * @platform ios
 */
export type ScanningOptions = {
  /**
   * The type of codes to scan for.
   */
  barcodeTypes: BarcodeType[];
  /**
   * Indicates whether people can use a two-finger pinch-to-zoom gesture.
   * @default true
   */
  isPinchToZoomEnabled?: boolean;
  /**
   * Guidance text, such as “Slow Down,” appears over the live video.
   * @default true
   */
  isGuidanceEnabled?: boolean;
  /**
   * Indicates whether the scanner displays highlights around recognized items.
   * @default false
   */
  isHighlightingEnabled?: boolean;
};

/**
 * The available barcode types that can be scanned.
 */
export type BarcodeType =
  | 'aztec'
  | 'ean13'
  | 'ean8'
  | 'qr'
  | 'pdf417'
  | 'upc_e'
  | 'datamatrix'
  | 'code39'
  | 'code93'
  | 'itf14'
  | 'codabar'
  | 'code128'
  | 'upc_a';

export { PermissionResponse, PermissionStatus, PermissionExpiration, PermissionHookOptions };
