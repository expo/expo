import {
  PermissionResponse,
  PermissionStatus,
  PermissionExpiration,
  PermissionHookOptions,
} from 'expo-modules-core';
import type { ViewProps } from 'react-native';

export enum CameraType {
  front = 'front',
  back = 'back',
}

export enum FlashMode {
  on = 'on',
  off = 'off',
  auto = 'auto',
  torch = 'torch',
}

export enum AutoFocus {
  on = 'on',
  off = 'off',
  /**
   * @platform web
   */
  auto = 'auto',
  /**
   * @platform web
   */
  singleShot = 'singleShot',
}

export enum WhiteBalance {
  auto = 'auto',
  /**
   * @platform android
   * @platform ios
   */
  sunny = 'sunny',
  /**
   * @platform android
   * @platform ios
   */
  cloudy = 'cloudy',
  /**
   * @platform android
   * @platform ios
   */
  shadow = 'shadow',
  /**
   * @platform android
   * @platform ios
   */
  incandescent = 'incandescent',
  /**
   * @platform android
   * @platform ios
   */
  fluorescent = 'fluorescent',
  /**
   * @platform web
   */
  continuous = 'continuous',
  /**
   * @platform web
   */
  manual = 'manual',
}

export enum ImageType {
  png = 'png',
  jpg = 'jpg',
}

/**
 * This option specifies what codec to use when recording a video.
 * @platform ios
 */
export enum VideoCodec {
  H264 = 'avc1',
  HEVC = 'hvc1',
  JPEG = 'jpeg',
  AppleProRes422 = 'apcn',
  AppleProRes4444 = 'ap4h',
}

/**
 * This option specifies the stabilization mode to use when recording a video.
 * @platform ios
 */
export enum VideoStabilization {
  off = 'off',
  standard = 'standard',
  cinematic = 'cinematic',
  auto = 'auto',
}

// @docsMissing
export enum VideoQuality {
  '2160p' = '2160p',
  '1080p' = '1080p',
  '720p' = '720p',
  '480p' = '480p',
  '4:3' = '4:3',
}

export enum CameraOrientation {
  portrait = 1,
  portraitUpsideDown = 2,
  landscapeLeft = 3,
  landscapeRight = 4,
}

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
   * Specify the quality of compression, from 0 to 1. 0 means compress for small size, 1 means compress for maximum quality.
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
  additionalExif?: { [name: string]: any };
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
   * Specify the quality of recorded video. Use one of [`VideoQuality.<value>`](#videoquality).
   * Possible values: for 16:9 resolution `2160p`, `1080p`, `720p`, `480p` : `Android only` and for 4:3 `4:3` (the size is 640x480).
   * If the chosen quality is not available for a device, the highest available is chosen.
   */
  quality?: number | string;
  /**
   * If present, video will be recorded with no sound.
   */
  mute?: boolean;
  /**
   * If `true`, the recorded video will be flipped along the vertical axis. iOS flips videos recorded with the front camera by default,
   * but you can reverse that back by setting this to `true`. On Android, this is handled in the user's device settings.
   * @platform ios
   */
  mirror?: boolean;
  /**
   * Only works if `useCamera2Api` is set to `true`. This option specifies a desired video bitrate. For example, `5*1000*1000` would be 5Mbps.
   * @platform android
   */
  videoBitrate?: number;
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

export type BarCodeSize = {
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
export type BarCodePoint = Point;

export type BarCodeBounds = {
  /**
   * The origin point of the bounding box.
   */
  origin: BarCodePoint;
  /**
   * The size of the bounding box.
   */
  size: BarCodeSize;
};

// @needsAudit
export type BarCodeScanningResult = {
  /**
   * The barcode type.
   */
  type: string;
  /**
   * The information encoded in the bar code.
   */
  data: string;
  /**
   * Corner points of the bounding box.
   * `cornerPoints` is not always available and may be empty. On iOS, for `code39` and `pdf417`
   * you don't get this value.
   */
  cornerPoints: BarCodePoint[];
  /**
   * The [BarCodeBounds](#barcodebounds) object.
   * `bounds` in some case will be representing an empty rectangle.
   * Moreover, `bounds` doesn't have to bound the whole barcode.
   * For some types, they will represent the area used by the scanner.
   */
  bounds: BarCodeBounds;
};

export type FaceDetectionResult = {
  /**
   * Array of objects representing results of face detection.
   * See [`FaceFeature`](facedetector/#facefeature) in FaceDetector documentation for more details.
   */
  faces: object[];
};

/**
 * @hidden
 */
export type ConstantsType = {
  Type: CameraType;
  FlashMode: FlashMode;
  AutoFocus: AutoFocus;
  WhiteBalance: WhiteBalance;
  VideoQuality: VideoQuality;
  VideoStabilization: VideoStabilization;
  VideoCodec: VideoCodec;
};

// @needsAudit
export type CameraProps = ViewProps & {
  /**
   * Camera facing. Use one of `CameraType`. When `CameraType.front`, use the front-facing camera.
   * When `CameraType.back`, use the back-facing camera.
   * @default CameraType.back
   */
  type?: number | CameraType;
  /**
   * Camera flash mode. Use one of [`FlashMode.<value>`](#flashmode-1). When `FlashMode.on`, the flash on your device will
   * turn on when taking a picture, when `FlashMode.off`, it won't. Setting to `FlashMode.auto` will fire flash if required,
   * `FlashMode.torch` turns on flash during the preview.
   * @default FlashMode.off
   */
  flashMode?: number | FlashMode;
  /**
   * Camera white balance. Use one of [`WhiteBalance.<value>`](#whitebalance). If a device does not support any of these values previous one is used.
   * @default WhiteBalance.auto
   */
  whiteBalance?: number | WhiteBalance;
  /**
   * State of camera auto focus. Use one of [`AutoFocus.<value>`](#autofocus-1). When `AutoFocus.on`,
   * auto focus will be enabled, when `AutoFocus.off`, it won't and focus will lock as it was in the moment of change,
   * but it can be adjusted on some devices via `focusDepth` prop.
   * @default AutoFocus.on
   */
  autoFocus?: boolean | number | AutoFocus;
  /**
   * A value between `0` and `1` being a percentage of device's max zoom. `0` - not zoomed, `1` - maximum zoom.
   * @default 0
   */
  zoom?: number;
  /**
   * A string representing aspect ratio of the preview, eg. `4:3`, `16:9`, `1:1`. To check if a ratio is supported
   * by the device use [`getSupportedRatiosAsync`](#getsupportedratiosasync).
   * @default 4:3
   * @platform android
   */
  ratio?: string;
  /**
   * Distance to plane of the sharpest focus. A value between `0` and `1` where: `0` - infinity focus, `1` - focus as close as possible.
   * For Android this is available only for some devices and when `useCamera2Api` is set to `true`.
   * @default 0
   */
  focusDepth?: number;
  /**
   * Callback invoked when camera preview has been set.
   */
  onCameraReady?: () => void;
  /**
   * Whether to use Android's Camera2 API. See `Note` at the top of this page.
   * @platform android
   */
  useCamera2Api?: boolean;
  /**
   * A string representing the size of pictures [`takePictureAsync`](#takepictureasync) will take.
   * Available sizes can be fetched with [`getAvailablePictureSizesAsync`](#getavailablepicturesizesasync).
   */
  pictureSize?: string;
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
   * Settings exposed by [`BarCodeScanner`](bar-code-scanner) module. Supported settings: **barCodeTypes**.
   * @example
   * ```tsx
   * <Camera
   *   barCodeScannerSettings={{
   *     barCodeTypes: [BarCodeScanner.Constants.BarCodeType.qr],
   *   }}
   * />
   * ```
   */
  barCodeScannerSettings?: BarCodeSettings;
  /**
   * Callback that is invoked when a bar code has been successfully scanned. The callback is provided with
   * an object of the [`BarCodeScanningResult`](#barcodescanningresult) shape, where the `type`
   * refers to the bar code type that was scanned and the `data` is the information encoded in the bar code
   * (in this case of QR codes, this is often a URL). See [`BarCodeScanner.Constants.BarCodeType`](bar-code-scanner#supported-formats)
   * for supported values.
   * @param scanningResult
   */
  onBarCodeScanned?: (scanningResult: BarCodeScanningResult) => void;
  /**
   * A settings object passed directly to an underlying module providing face detection features.
   * See [`DetectionOptions`](facedetector/#detectionoptions) in FaceDetector documentation for details.
   */
  faceDetectorSettings?: object;
  /**
   * Callback invoked with results of face detection on the preview.
   * See [`DetectionResult`](facedetector/#detectionresult) in FaceDetector documentation for more details.
   * @param faces
   */
  onFacesDetected?: (faces: FaceDetectionResult) => void;
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
export type CameraNativeProps = {
  pointerEvents?: any;
  style?: any;
  ref?: Function;
  onCameraReady?: CameraReadyListener;
  onMountError?: MountErrorListener;
  onBarCodeScanned?: (event: { nativeEvent: BarCodeScanningResult }) => void;
  onFacesDetected?: (event: { nativeEvent: FaceDetectionResult }) => void;
  onFaceDetectionError?: (event: { nativeEvent: Error }) => void;
  onPictureSaved?: PictureSavedListener;
  onResponsiveOrientationChanged?: ResponsiveOrientationChangedListener;
  type?: number | string;
  flashMode?: number | string;
  autoFocus?: string | boolean | number;
  focusDepth?: number;
  zoom?: number;
  whiteBalance?: number | string;
  pictureSize?: string;
  barCodeScannerSettings?: BarCodeSettings;
  faceDetectorSettings?: object;
  barCodeScannerEnabled?: boolean;
  faceDetectorEnabled?: boolean;
  ratio?: string;
  useCamera2Api?: boolean;
  poster?: string;
  responsiveOrientationWhenOrientationLocked?: boolean;
};

// @docsMissing
export type BarCodeSettings = {
  barCodeTypes: string[];
  interval?: number;
};

export { PermissionResponse, PermissionStatus, PermissionExpiration, PermissionHookOptions };
