import { ViewProps } from 'react-native';
import {
  PermissionResponse,
  PermissionStatus,
  PermissionExpiration,
} from 'unimodules-permissions-interface';

export enum CameraType {
  front = 'front',
  back = 'back',
}

export enum ImageType {
  png = 'png',
  jpg = 'jpg',
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

export type BarCodePoint = {
  x: number;
  y: number;
};

export type BarCodeScanningResult = {
  type: string;
  data: string;
  /** @platform web */
  cornerPoints?: BarCodePoint[];
};

export type FaceDetectionResult = { faces: any[] };

export type CameraProps = ViewProps & {
  zoom?: number;
  ratio?: string;
  focusDepth?: number;
  type?: number | string;
  onCameraReady?: Function;
  useCamera2Api?: boolean;
  flashMode?: number | string;
  whiteBalance?: number | string;
  autoFocus?: string | boolean | number;
  pictureSize?: string;
  videoStabilizationMode?: number;
  onMountError?: (event: CameraMountError) => void;
  barCodeScannerSettings?: object;
  onBarCodeScanned?: (scanningResult: BarCodeScanningResult) => void;
  faceDetectorSettings?: object;
  onFacesDetected?: (faces: FaceDetectionResult) => void;
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
};

export type BarCodeSettings = {
  barCodeTypes: string[];
  interval?: number;
};

export { PermissionResponse, PermissionStatus, PermissionExpiration };
