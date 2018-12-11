// @flow

export type PictureOptions = {
  quality?: number,
  base64?: boolean,
  exif?: boolean,
  skipProcessing?: boolean,
  onPictureSaved?: Function,
  // internal
  id?: number,
  fastMode?: boolean,
};

export type RecordingOptions = {
  maxDuration?: number,
  maxFileSize?: number,
  quality?: number | string,
};

export type CapturedPicture = {
  width: number,
  height: number,
  uri: string,
  base64?: string,
  exif?: Object,
};

export type RecordingResult = {
  uri: string,
};

export type EventCallbackArgumentsType = {
  nativeEvent: Object,
};

export type MountErrorNativeEventType = {
  message: string,
};

export type PictureSavedNativeEventType = {
  data: CapturedPicture,
  id: number,
};

export type PropsType = ViewPropTypes & {
  zoom?: number,
  ratio?: string,
  focusDepth?: number,
  type?: number | string,
  onCameraReady?: Function,
  useCamera2Api?: boolean,
  flashMode?: number | string,
  whiteBalance?: number | string,
  autoFocus?: string | boolean | number,
  pictureSize?: string,
  videoStabilizationMode?: number,
  onMountError?: MountErrorNativeEventType => void,
  barCodeScannerSettings?: {},
  onBarCodeScanned?: ({ type: string, data: string }) => void,
  faceDetectorSettings?: {},
  onFacesDetected?: ({ faces: Array<*> }) => void,
};
