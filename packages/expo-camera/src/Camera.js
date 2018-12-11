// @flow
import { requireNativeViewManager } from 'expo-core';
import { UnavailabilityError } from 'expo-errors';
import LibCameraPhoto from 'jslib-html5-camera-photo';
import mapValues from 'lodash.mapvalues';
import PropTypes from 'prop-types';
import React from 'react';
import { findNodeHandle, Platform, StyleSheet, ViewPropTypes } from 'react-native';

import CameraManager from './ExponentCameraManager';

import type {
  PictureOptions,
  RecordingOptions,
  CapturedPicture,
  RecordingResult,
  EventCallbackArgumentsType,
  MountErrorNativeEventType,
  PictureSavedNativeEventType,
  PropsType,
} from './Camera.types';

const EventThrottleMs = 500;

const _PICTURE_SAVED_CALLBACKS = {};
let _GLOBAL_PICTURE_ID = 1;

export default class Camera extends React.Component<PropsType> {
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

  static propTypes = {
    ...ViewPropTypes,
    zoom: PropTypes.number,
    ratio: PropTypes.string,
    focusDepth: PropTypes.number,
    onMountError: PropTypes.func,
    pictureSize: PropTypes.string,
    onCameraReady: PropTypes.func,
    useCamera2Api: PropTypes.bool,
    onBarCodeScanned: PropTypes.func,
    barCodeScannerSettings: PropTypes.object,
    onFacesDetected: PropTypes.func,
    faceDetectorSettings: PropTypes.object,
    type: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    flashMode: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    videoStabilizationMode: PropTypes.number,
    whiteBalance: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    autoFocus: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.bool]),
  };

  static defaultProps: Object = {
    zoom: 0,
    ratio: '4:3',
    focusDepth: 0,
    faceDetectorSettings: {},
    type: CameraManager.Type.back,
    autoFocus: CameraManager.AutoFocus.on,
    flashMode: CameraManager.FlashMode.off,
    whiteBalance: CameraManager.WhiteBalance.auto,
  };

  _cameraRef: ?Object;
  _cameraHandle: ?number;
  _lastEvents: { [string]: string };
  _lastEventsTimes: { [string]: Date };

  constructor(props: PropsType) {
    super(props);
    this._lastEvents = {};
    this._lastEventsTimes = {};
  }

  async takePictureAsync(options?: PictureOptions): Promise<CapturedPicture> {
    if (!options) {
      options = {};
    }
    if (!options.quality) {
      options.quality = 1;
    }
    if (options.onPictureSaved) {
      const id = _GLOBAL_PICTURE_ID++;
      _PICTURE_SAVED_CALLBACKS[id] = options.onPictureSaved;
      options.id = id;
      options.fastMode = true;
    }
    return await CameraManager.takePicture(options, this._cameraHandle);
  }

  async getSupportedRatiosAsync(): Promise<Array<string>> {
    if (!CameraManager.getSupportedRatios) {
      throw new UnavailabilityError('Camera', 'getSupportedRatiosAsync');
    }

    return await CameraManager.getSupportedRatios(this._cameraHandle);
  }

  async getAvailablePictureSizesAsync(ratio?: string): Promise<Array<string>> {
    if (!CameraManager.getAvailablePictureSizes) {
      throw new UnavailabilityError('Camera', 'getAvailablePictureSizesAsync');
    }
    return await CameraManager.getAvailablePictureSizes(ratio, this._cameraHandle);
  }

  async recordAsync(options?: RecordingOptions): Promise<RecordingResult> {
    if (!CameraManager.record) {
      throw new UnavailabilityError('Camera', 'recordAsync');
    }

    if (!options || typeof options !== 'object') {
      options = {};
    } else if (typeof options.quality === 'string') {
      options.quality = Camera.Constants.VideoQuality[options.quality];
    }
    return await CameraManager.record(options, this._cameraHandle);
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

  _onMountError = ({ nativeEvent }: { nativeEvent: MountErrorNativeEventType }) => {
    if (this.props.onMountError) {
      this.props.onMountError(nativeEvent);
    }
  };

  _onPictureSaved = ({ nativeEvent }: { nativeEvent: PictureSavedNativeEventType }) => {
    const callback = _PICTURE_SAVED_CALLBACKS[nativeEvent.id];
    if (callback) {
      callback(nativeEvent.data);
      delete _PICTURE_SAVED_CALLBACKS[nativeEvent.id];
    }
  };

  _onObjectDetected = (callback: ?Function) => ({ nativeEvent }: EventCallbackArgumentsType) => {
    const { type } = nativeEvent;
    if (
      this._lastEvents[type] &&
      this._lastEventsTimes[type] &&
      JSON.stringify(nativeEvent) === this._lastEvents[type] &&
      new Date() - this._lastEventsTimes[type] < EventThrottleMs
    ) {
      return;
    }

    if (callback) {
      callback(nativeEvent);
      this._lastEventsTimes[type] = new Date();
      this._lastEvents[type] = JSON.stringify(nativeEvent);
    }
  };

  _setReference = (ref: ?Object) => {
    if (ref) {
      this._cameraRef = ref;
      if (Platform.OS === 'web') {
        this._cameraHandle = new LibCameraPhoto(this._cameraRef);
        this.resumePreview();
      } else {
        this._cameraHandle = findNodeHandle(ref);
      }
    } else {
      this._cameraRef = null;
      this._cameraHandle = null;
    }
  };

  _onBarCodeScanned = () => {
    const onBarCodeRead =
      this.props.onBarCodeRead &&
      (data => {
        console.warn("'onBarCodeRead' is deprecated in favour of 'onBarCodeScanned'");
        return this.props.onBarCodeRead(data);
      });
    return this.props.onBarCodeScanned || onBarCodeRead;
  };

  render() {
    const nativeProps = this._convertNativeProps(this.props);

    if (Platform.OS === 'web') {
      return (
        <video
          style={StyleSheet.flatten([
            nativeProps.style,
            { objectFit: 'cover' },
            flipCameraStyle(this.props.type !== CameraManager.Type.back),
          ])}
          ref={this._setReference}
          autoPlay
          playsInline
        />
      );
    } else {
      return (
        <ExponentCamera
          {...nativeProps}
          ref={this._setReference}
          onCameraReady={this._onCameraReady}
          onMountError={this._onMountError}
          onPictureSaved={this._onPictureSaved}
          onBarCodeScanned={this._onObjectDetected(this._onBarCodeScanned())}
          onFacesDetected={this._onObjectDetected(this.props.onFacesDetected)}
        />
      );
    }
  }

  _convertNativeProps(props: PropsType) {
    const newProps = mapValues(props, this._convertProp);

    const propsKeys = Object.keys(newProps);
    if (!propsKeys.includes('barCodeScannerSettings') && propsKeys.includes('barCodeTypes')) {
      // barCodeTypes is deprecated
      newProps.barCodeScannerSettings = {
        barCodeTypes: newProps.barCodeTypes,
      };
    }

    if (props.onBarCodeScanned || props.onBarCodeRead) {
      // onBarCodeRead is deprecated
      newProps.barCodeScannerEnabled = true;
    }

    if (props.onFacesDetected) {
      newProps.faceDetectorEnabled = true;
    }

    if (Platform.OS === 'ios') {
      delete newProps.ratio;
      delete newProps.useCamera2Api;
    }

    return newProps;
  }

  _convertProp(value: *, key: string): * {
    if (typeof value === 'string' && Camera.ConversionTables[key]) {
      return Camera.ConversionTables[key][value];
    }

    return value;
  }
}

function flipCameraStyle(shouldFlip) {
  if (shouldFlip) {
    return { transform: 'rotateY(180deg)' };
  }
  return { transform: 'none' };
}

let ExponentCamera = null;
if (Platform.OS !== 'web') {
  ExponentCamera = requireNativeViewManager('ExponentCamera', Camera);
}

export const Constants = Camera.Constants;
