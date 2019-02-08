import { View } from 'react-native';

export type PictureOptions = {
  quality?: number;
  base64?: boolean;
  exif?: boolean;
  skipProcessing?: boolean;
  onPictureSaved?: Function;
  // internal
  id?: number;
  fastMode?: boolean;
};

export type RecordingOptions = {
  maxDuration?: number;
  maxFileSize?: number;
  quality?: number | string;
};

export type CapturedPicture = {
  width: number;
  height: number;
  uri: string;
  base64?: string;
  exif?: any;
};

export type MountError = { message: string };

export type BarCodeScanningResult = { type: string; data: string };

export type FaceDetectionResult = { faces: any[] };

export type Props = React.ComponentProps<typeof View> & {
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
  onMountError?: (event: MountError) => void;
  barCodeScannerSettings?: {};
  onBarCodeScanned?: (scanningResult: BarCodeScanningResult) => void;
  faceDetectorSettings?: {};
  onFacesDetected?: (faces: FaceDetectionResult) => void;
};

export type NativeProps = {
  style?: any;
  ref?: Function;
  onCameraReady?: Function;
  onMountError?: ({ nativeEvent }: { nativeEvent: MountError }) => void;
  onBarCodeScanned?: ({ nativeEvent }: { nativeEvent: BarCodeScanningResult }) => void;
  onFacesDetected?: ({ nativeEvent }: { nativeEvent: FaceDetectionResult }) => void;
  onFaceDetectionError?: Function;
  onPictureSaved?: Function;
  type?: number | string;
  flashMode?: number | string;
  autoFocus?: string | boolean | number;
  focusDepth?: number;
  zoom?: number;
  whiteBalance?: number | string;
  pictureSize?: string;
  barCodeScannerSettings?: {};
  barCodeScannerEnabled?: boolean;
  faceDetectorEnabled?: boolean;
  faceDetectorSettings?: {};
  // Android
  ratio?: string;
  useCamera2Api?: boolean;
};
