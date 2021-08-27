import { createPermissionHook, Platform, UnavailabilityError } from 'expo-modules-core';
import * as React from 'react';
import { findNodeHandle } from 'react-native';

import {
  BarCodeScanningResult,
  CameraCapturedPicture,
  CameraMountError,
  CameraNativeProps,
  CameraPictureOptions,
  CameraProps,
  CameraRecordingOptions,
  ConstantsType,
  FaceDetectionResult,
  PermissionExpiration,
  PermissionResponse,
  PermissionStatus,
  VideoCodec,
} from './Camera.types';
import ExponentCamera from './ExponentCamera';
import CameraManager from './ExponentCameraManager';
import { ConversionTables, ensureNativeProps } from './utils/props';

const EventThrottleMs = 500;

const _PICTURE_SAVED_CALLBACKS = {};

let _GLOBAL_PICTURE_ID = 1;

function ensurePictureOptions(options?: CameraPictureOptions): CameraPictureOptions {
  const pictureOptions: CameraPictureOptions =
    !options || typeof options !== 'object' ? {} : options;

  if (!pictureOptions.quality) {
    pictureOptions.quality = 1;
  }
  if (pictureOptions.onPictureSaved) {
    const id = _GLOBAL_PICTURE_ID++;
    _PICTURE_SAVED_CALLBACKS[id] = pictureOptions.onPictureSaved;
    pictureOptions.id = id;
    pictureOptions.fastMode = true;
  }
  return pictureOptions;
}

function ensureRecordingOptions(options?: CameraRecordingOptions): CameraRecordingOptions {
  let recordingOptions = options || {};

  if (!recordingOptions || typeof recordingOptions !== 'object') {
    recordingOptions = {};
  } else if (typeof recordingOptions.quality === 'string') {
    recordingOptions.quality = Camera.Constants.VideoQuality[recordingOptions.quality];
  }

  return recordingOptions;
}

function _onPictureSaved({
  nativeEvent,
}: {
  nativeEvent: { data: CameraCapturedPicture; id: number };
}) {
  const { id, data } = nativeEvent;
  const callback = _PICTURE_SAVED_CALLBACKS[id];
  if (callback) {
    callback(data);
    delete _PICTURE_SAVED_CALLBACKS[id];
  }
}

export default class Camera extends React.Component<CameraProps> {
  static async isAvailableAsync(): Promise<boolean> {
    if (!CameraManager.isAvailableAsync) {
      throw new UnavailabilityError('expo-camera', 'isAvailableAsync');
    }

    return await CameraManager.isAvailableAsync();
  }

  static async getAvailableCameraTypesAsync(): Promise<('front' | 'back')[]> {
    if (!CameraManager.getAvailableCameraTypesAsync) {
      throw new UnavailabilityError('expo-camera', 'getAvailableCameraTypesAsync');
    }

    return await CameraManager.getAvailableCameraTypesAsync();
  }

  static async getAvailableVideoCodecsAsync(): Promise<string[]> {
    if (!CameraManager.getAvailableVideoCodecsAsync) {
      throw new UnavailabilityError('Camera', 'getAvailableVideoCodecsAsync');
    }

    return await CameraManager.getAvailableVideoCodecsAsync();
  }

  static Constants: ConstantsType = {
    Type: CameraManager.Type,
    FlashMode: CameraManager.FlashMode,
    AutoFocus: CameraManager.AutoFocus,
    WhiteBalance: CameraManager.WhiteBalance,
    VideoQuality: CameraManager.VideoQuality,
    VideoStabilization: CameraManager.VideoStabilization || {},
    VideoCodec: CameraManager.VideoCodec,
  };

  // Values under keys from this object will be transformed to native options
  static ConversionTables = ConversionTables;

  static defaultProps: CameraProps = {
    zoom: 0,
    ratio: '4:3',
    focusDepth: 0,
    faceDetectorSettings: {},
    type: CameraManager.Type.back,
    autoFocus: CameraManager.AutoFocus.on,
    flashMode: CameraManager.FlashMode.off,
    whiteBalance: CameraManager.WhiteBalance.auto,
  };

  /**
   * @deprecated Use `getCameraPermissionsAync` or `getMicrophonePermissionsAsync` instead.
   */
  static async getPermissionsAsync(): Promise<PermissionResponse> {
    console.warn(
      `"getPermissionsAsync()" is now deprecated. Please use "getCameraPermissionsAsync()" or "getMicrophonePermissionsAsync()" instead.`
    );
    return CameraManager.getPermissionsAsync();
  }

  /**
   * @deprecated Use `requestCameraPermissionsAsync` or `requestMicrophonePermissionsAsync` instead.
   */
  static async requestPermissionsAsync(): Promise<PermissionResponse> {
    console.warn(
      `"requestPermissionsAsync()" is now deprecated. Please use "requestCameraPermissionsAsync()" or "requestMicrophonePermissionsAsync()" instead.`
    );
    return CameraManager.requestPermissionsAsync();
  }

  static async getCameraPermissionsAsync(): Promise<PermissionResponse> {
    return CameraManager.getCameraPermissionsAsync();
  }

  static async requestCameraPermissionsAsync(): Promise<PermissionResponse> {
    return CameraManager.requestCameraPermissionsAsync();
  }

  // @needsAudit
  /**
   * Check or request permissions to access the camera.
   * This uses both `requestCameraPermissionsAsync` and `getCameraPermissionsAsync` to interact with the permissions.
   *
   * @example
   * ```ts
   * const [status, requestPermission] = Camera.useCameraPermissions();
   * ```
   */
  static useCameraPermissions = createPermissionHook({
    getMethod: Camera.getCameraPermissionsAsync,
    requestMethod: Camera.requestCameraPermissionsAsync,
  });

  static async getMicrophonePermissionsAsync(): Promise<PermissionResponse> {
    return CameraManager.getMicrophonePermissionsAsync();
  }

  static async requestMicrophonePermissionsAsync(): Promise<PermissionResponse> {
    return CameraManager.requestMicrophonePermissionsAsync();
  }

  // @needsAudit
  /**
   * Check or request permissions to access the microphone.
   * This uses both `requestMicrophonePermissionsAsync` and `getMicrophonePermissionsAsync` to interact with the permissions.
   *
   * @example
   * ```ts
   * const [status, requestPermission] = Camera.useMicrophonePermissions();
   * ```
   */
  static useMicrophonePermissions = createPermissionHook({
    getMethod: Camera.getMicrophonePermissionsAsync,
    requestMethod: Camera.requestMicrophonePermissionsAsync,
  });

  _cameraHandle?: number | null;
  _cameraRef?: React.Component | null;
  _lastEvents: { [eventName: string]: string } = {};
  _lastEventsTimes: { [eventName: string]: Date } = {};

  async takePictureAsync(options?: CameraPictureOptions): Promise<CameraCapturedPicture> {
    const pictureOptions = ensurePictureOptions(options);

    return await CameraManager.takePicture(pictureOptions, this._cameraHandle);
  }

  async getSupportedRatiosAsync(): Promise<string[]> {
    if (!CameraManager.getSupportedRatios) {
      throw new UnavailabilityError('Camera', 'getSupportedRatiosAsync');
    }

    return await CameraManager.getSupportedRatios(this._cameraHandle);
  }

  async getAvailablePictureSizesAsync(ratio?: string): Promise<string[]> {
    if (!CameraManager.getAvailablePictureSizes) {
      throw new UnavailabilityError('Camera', 'getAvailablePictureSizesAsync');
    }
    return await CameraManager.getAvailablePictureSizes(ratio, this._cameraHandle);
  }

  async recordAsync(
    options?: CameraRecordingOptions
  ): Promise<{ uri: string; codec?: VideoCodec }> {
    if (!CameraManager.record) {
      throw new UnavailabilityError('Camera', 'recordAsync');
    }

    const recordingOptions = ensureRecordingOptions(options);
    return await CameraManager.record(recordingOptions, this._cameraHandle);
  }

  stopRecording() {
    if (!CameraManager.stopRecording) {
      throw new UnavailabilityError('Camera', 'stopRecording');
    }

    CameraManager.stopRecording(this._cameraHandle);
  }

  pausePreview() {
    if (!CameraManager.pausePreview) {
      throw new UnavailabilityError('Camera', 'pausePreview');
    }

    CameraManager.pausePreview(this._cameraHandle);
  }

  resumePreview() {
    if (!CameraManager.resumePreview) {
      throw new UnavailabilityError('Camera', 'resumePreview');
    }

    CameraManager.resumePreview(this._cameraHandle);
  }

  _onCameraReady = () => {
    if (this.props.onCameraReady) {
      this.props.onCameraReady();
    }
  };

  _onMountError = ({ nativeEvent }: { nativeEvent: { message: string } }) => {
    if (this.props.onMountError) {
      this.props.onMountError(nativeEvent);
    }
  };

  _onObjectDetected =
    (callback?: Function) =>
    ({ nativeEvent }: { nativeEvent: any }) => {
      const { type } = nativeEvent;
      if (
        this._lastEvents[type] &&
        this._lastEventsTimes[type] &&
        JSON.stringify(nativeEvent) === this._lastEvents[type] &&
        new Date().getTime() - this._lastEventsTimes[type].getTime() < EventThrottleMs
      ) {
        return;
      }

      if (callback) {
        callback(nativeEvent);
        this._lastEventsTimes[type] = new Date();
        this._lastEvents[type] = JSON.stringify(nativeEvent);
      }
    };

  _setReference = (ref?: React.Component) => {
    if (ref) {
      this._cameraRef = ref;
      // TODO(Bacon): Unify these - perhaps with hooks?
      if (Platform.OS === 'web') {
        this._cameraHandle = ref as any;
      } else {
        this._cameraHandle = findNodeHandle(ref);
      }
    } else {
      this._cameraRef = null;
      this._cameraHandle = null;
    }
  };

  render() {
    const nativeProps = ensureNativeProps(this.props);

    const onBarCodeScanned = this.props.onBarCodeScanned
      ? this._onObjectDetected(this.props.onBarCodeScanned)
      : undefined;
    const onFacesDetected = this._onObjectDetected(this.props.onFacesDetected);

    return (
      <ExponentCamera
        {...nativeProps}
        ref={this._setReference}
        onCameraReady={this._onCameraReady}
        onMountError={this._onMountError}
        onBarCodeScanned={onBarCodeScanned}
        onFacesDetected={onFacesDetected}
        onPictureSaved={_onPictureSaved}
      />
    );
  }
}

export const {
  Constants,
  getPermissionsAsync,
  requestPermissionsAsync,
  getCameraPermissionsAsync,
  requestCameraPermissionsAsync,
  getMicrophonePermissionsAsync,
  requestMicrophonePermissionsAsync,
} = Camera;

export {
  CameraCapturedPicture,
  CameraNativeProps,
  CameraPictureOptions,
  CameraProps,
  CameraRecordingOptions,
  PermissionResponse,
  PermissionStatus,
  PermissionExpiration,
  BarCodeScanningResult,
  FaceDetectionResult,
  CameraMountError,
};
