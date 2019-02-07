import { UnavailabilityError } from 'expo-errors';
import mapValues from 'lodash.mapvalues';
import PropTypes from 'prop-types';
import React from 'react';
import { findNodeHandle, Platform, ViewPropTypes } from 'react-native';
import { CapturedPicture, PictureOptions, Props, RecordingOptions } from './Camera.types';
import ExponentCamera from './ExponentCamera';
import _CameraManager from './ExponentCameraManager';

// TODO: Bacon: Fix multiplatform
const CameraManager = _CameraManager as any;

const EventThrottleMs = 500;

const _PICTURE_SAVED_CALLBACKS = {};

let _GLOBAL_PICTURE_ID = 1;

function ensurePictureOptions(options?: PictureOptions): PictureOptions {
  let pictureOptions = options || {};

  if (!pictureOptions || typeof pictureOptions !== 'object') {
    pictureOptions = {};
  }

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

function ensureRecordingOptions(options?: RecordingOptions): RecordingOptions {
  let recordingOptions = options || {};

  if (!recordingOptions || typeof recordingOptions !== 'object') {
    recordingOptions = {};
  } else if (typeof recordingOptions.quality === 'string') {
    recordingOptions.quality = Camera.Constants.VideoQuality[recordingOptions.quality];
  }

  return recordingOptions;
}

function ensureNativeProps(options?: Props): Props {
  let props = options || {};

  if (!props || typeof props !== 'object') {
    props = {};
  }

  const newProps = mapValues(props, convertProp);

  const propsKeys = Object.keys(newProps);
  // barCodeTypes is deprecated
  if (!propsKeys.includes('barCodeScannerSettings') && propsKeys.includes('barCodeTypes')) {
    newProps.barCodeScannerSettings = {
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

function _onPictureSaved({ nativeEvent }: { nativeEvent: { data: CapturedPicture; id: number } }) {
  const { id, data } = nativeEvent;
  const callback = _PICTURE_SAVED_CALLBACKS[id];
  if (callback) {
    callback(data);
    delete _PICTURE_SAVED_CALLBACKS[id];
  }
}

export default class Camera extends React.Component<Props> {
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

  static defaultProps: Props = {
    zoom: 0,
    ratio: '4:3',
    focusDepth: 0,
    faceDetectorSettings: {},
    type: CameraManager.Type && CameraManager.Type.back,
    autoFocus: CameraManager.AutoFocus && CameraManager.AutoFocus.on,
    flashMode: CameraManager.FlashMode && CameraManager.FlashMode.off,
    whiteBalance: CameraManager.WhiteBalance && CameraManager.WhiteBalance.auto,
  };

  _cameraHandle?: number | null;
  _cameraRef?: React.Component | null;
  _lastEvents: { [eventName: string]: string } = {};
  _lastEventsTimes: { [eventName: string]: Date } = {};

  async takePictureAsync(options?: PictureOptions): Promise<CapturedPicture> {
    const pictureOptions = ensurePictureOptions(options);

    return await CameraManager.takePicture(pictureOptions, this._cameraHandle);
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

  async recordAsync(options?: RecordingOptions): Promise<{ uri: string }> {
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
      // TODO: Bacon: Make this one...
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

    const onBarCodeScanned = this._onObjectDetected(this.props.onBarCodeScanned);
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

export const Constants = Camera.Constants;
