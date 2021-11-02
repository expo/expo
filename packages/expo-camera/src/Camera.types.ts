import {
  PermissionResponse,
  PermissionStatus,
  PermissionExpiration,
  PermissionHookOptions,
} from 'expo-modules-core';
import { ViewProps } from 'react-native';

export enum CameraType {
  /**
   * @platforms ios, android, web
   */
  front = 'front',
  /**
   * @platforms ios, android, web
   */
  back = 'back',
}

export enum FlashMode {
  /**
   * @platforms ios, android, web
   */
  on = 'on',
  /**
   * @platforms ios, android, web
   */
  off = 'off',
  /**
   * @platforms ios, android, web
   */
  auto = 'auto',
  /**
   * @platforms ios, android, web
   */
  torch = 'torch',
}

export enum AutoFocus {
  /**
   * @platforms ios, android, web
   */
  on = 'on',
  /**
   * @platforms ios, android, web
   */
  off = 'off',
  /**
   * @platforms web
   */
  auto = 'auto',
  /**
   * @platforms web
   */
  singleShot = 'singleShot',
}

export enum WhiteBalance {
  /**
   * @platforms ios, android, web
   */
  auto = 'auto',
  /**
   * @platforms ios, android
   */
  sunny = 'sunny',
  /**
   * @platforms ios, android
   */
  cloudy = 'cloudy',
  /**
   * @platforms ios, android
   */
  shadow = 'shadow',
  /**
   * @platforms ios, android
   */
  incandescent = 'incandescent',
  /**
   * @platforms ios, android
   */
  fluorescent = 'fluorescent',
  /**
   * @platforms web
   */
  continuous = 'continuous',
  /**
   * @platforms web
   */
  manual = 'manual',
}

export enum ImageType {
  png = 'png',
  jpg = 'jpg',
}

/**
 * This option specifies what codec to use when recording a video.
 */
export enum VideoCodec {
  /**
   * @platforms ios
   */
  H264 = 'avc1',
  /**
   * @platforms ios
   */
  HEVC = 'hvc1',
  /**
   * @platforms ios
   */
  JPEG = 'jpeg',
  /**
   * @platforms ios
   */
  AppleProRes422 = 'apcn',
  /**
   * @platforms ios
   */
  AppleProRes4444 = 'ap4h',
}

export type ImageParameters = {
  imageType: ImageType;
  quality: number | null;
};

export type ImageSize = {
  width: number;
  height: number;
};

export type WebCameraSettings = Partial<{
  autoFocus: string;
  flashMode: string;
  whiteBalance: string;
  exposureCompensation: number;
  colorTemperature: number;
  iso: number;
  brightness: number;
  contrast: number;
  saturation: number;
  sharpness: number;
  focusDistance: number;
  zoom: number;
}>;

export type CapturedPicture = {
  width: number;
  height: number;
  uri: string;
  base64?: string;
  // note(bacon): The types are currently only defined for web.
  exif?: Partial<MediaTrackSettings>;
};

export type CameraPictureOptions = {
  quality?: number;
  base64?: boolean;
  exif?: boolean;
  onPictureSaved?: (picture: CameraCapturedPicture) => void;
  // TODO(Bacon): Is it possible to implement this in the browser?
  skipProcessing?: boolean;
  // Web-only
  scale?: number;
  imageType?: ImageType;
  isImageMirror?: boolean;
  // internal
  id?: number;
  fastMode?: boolean;
};

export type CameraRecordingOptions = {
  maxDuration?: number;
  maxFileSize?: number;
  quality?: number | string;
  mute?: boolean;
  mirror?: boolean;
  // Android
  videoBitrate?: number;
  // iOS
  codec?: VideoCodec;
};

export type CameraCapturedPicture = {
  width: number;
  height: number;
  uri: string;
  base64?: string;
  exif?: any;
};

export type PictureSavedListener = (event: {
  nativeEvent: { data: CapturedPicture; id: number };
}) => void;

export type CameraReadyListener = () => void;

export type MountErrorListener = (event: { nativeEvent: CameraMountError }) => void;

export type CameraMountError = { message: string };

type Point = {
  x: number;
  y: number;
};

export type BarCodePoint = Point;

export type BarCodeScanningResult = {
  type: string;
  data: string;
  /** @platform web */
  cornerPoints?: BarCodePoint[];
};

export type Face = {
  faceID: number;
  bounds: {
    origin: Point;
    size: {
      height: number;
      width: number;
    };
  };
  rollAngle: number;
  yawAngle: number;
  smilingProbability: number;
  leftEarPosition: Point;
  rightEarPosition: Point;
  leftEyePosition: Point;
  leftEyeOpenProbability: number;
  rightEyePosition: Point;
  rightEyeOpenProbability: number;
  leftCheekPosition: Point;
  rightCheekPosition: Point;
  mouthPosition: Point;
  leftMouthPosition: Point;
  rightMouthPosition: Point;
  noseBasePosition: Point;
};

export type FaceDetectionResult = { faces: Face[] };

export type ConstantsType = {
  Type: typeof CameraType;
  FlashMode: typeof FlashMode;
  AutoFocus: typeof AutoFocus;
  WhiteBalance: typeof WhiteBalance;
  VideoQuality: any;
  VideoStabilization: any;
  VideoCodec: typeof VideoCodec;
};

export type CameraProps = ViewProps & {
  type?: number | keyof typeof CameraType;
  flashMode?: number | keyof typeof FlashMode;
  whiteBalance?: number | keyof typeof WhiteBalance;
  autoFocus?: boolean | number | keyof typeof AutoFocus;
  zoom?: number;
  ratio?: string;
  focusDepth?: number;
  onCameraReady?: Function;
  useCamera2Api?: boolean;
  pictureSize?: string;
  videoStabilizationMode?: number;
  onMountError?: (event: CameraMountError) => void;
  barCodeScannerSettings?: object;
  onBarCodeScanned?: (scanningResult: BarCodeScanningResult) => void;
  faceDetectorSettings?: object;
  onFacesDetected?: (faces: FaceDetectionResult) => void;
  poster?: string;
};

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
  // Android
  ratio?: string;
  useCamera2Api?: boolean;
  // Web
  poster?: string;
};

export type BarCodeSettings = {
  barCodeTypes: string[];
  interval?: number;
};

export { PermissionResponse, PermissionStatus, PermissionExpiration, PermissionHookOptions };
