import { Platform, UnavailabilityError } from '@unimodules/core';
import mapValues from 'lodash/mapValues';
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
  FaceDetectionResult,
  PermissionExpiration,
  PermissionResponse,
  PermissionStatus,
} from './Camera.types';
import ExponentCamera from './ExponentCamera';
import CameraManager from './ExponentCameraManager';

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

function ensureNativeProps(options?: CameraProps): CameraNativeProps {
  let props = options || {};

  if (!props || typeof props !== 'object') {
    props = {};
  }

  const newProps: CameraNativeProps = mapValues(props, convertProp);

  const propsKeys = Object.keys(newProps);
  // barCodeTypes is deprecated
  if (!propsKeys.includes('barCodeScannerSettings') && propsKeys.includes('barCodeTypes')) {
    if (__DEV__) {
      console.warn(
        `The "barCodeTypes" prop for Camera is deprecated and will be removed in SDK 34. Use "barCodeScannerSettings" instead.`
      );
    }
    newProps.barCodeScannerSettings = {
      // @ts-ignore
      barCodeTypes: newProps.barCodeTypes,
    };
  }

  if (props.onBarCodeScanned) {
    newProps.barCodeScannerEnabled = true;
  }

  if (props.onFacesDetected) {
    newProps.faceDetectorEnabled = true;
  }

  if (Platform.OS !== 'android') {
    delete newProps.ratio;
    delete newProps.useCamera2Api;
  }

  return newProps;
}

function convertProp(value: any, key: string): any {
  if (typeof value === 'string' && Camera.ConversionTables[key]) {
    return Camera.ConversionTables[key][value];
  }

  return value;
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

  static Constants = {
    Type: CameraManager.Type,
    FlashMode: CameraManager.FlashMode,
    AutoFocus: CameraManager.AutoFocus,
    WhiteBalance: CameraManager.WhiteBalance,
    VideoQuality: CameraManager.VideoQuality,
    VideoStabilization: CameraManager.VideoStabilization || {},
  };

  // Values under keys from this object will be transformed to native options
  static ConversionTables = {
    type: CameraManager.Type,
    flashMode: CameraManager.FlashMode,
    autoFocus: CameraManager.AutoFocus,
    whiteBalance: CameraManager.WhiteBalance,
  };

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

  static async getPermissionsAsync(): Promise<PermissionResponse> {
    return CameraManager.getPermissionsAsync();
  }

  static async requestPermissionsAsync(): Promise<PermissionResponse> {
    return CameraManager.requestPermissionsAsync();
  }

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

  async recordAsync(options?: CameraRecordingOptions): Promise<{ uri: string }> {
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

  _onObjectDetected = (callback?: Function) => ({ nativeEvent }: { nativeEvent: any }) => {
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

export const { Constants, getPermissionsAsync, requestPermissionsAsync } = Camera;

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
