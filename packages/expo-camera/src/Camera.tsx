import React from 'react';
import { View } from 'react-native';
import PropTypes from 'prop-types';
import mapValues from 'lodash.mapvalues';
import { NativeModulesProxy, requireNativeViewManager } from 'expo-core';
import { findNodeHandle, ViewPropTypes, Platform } from 'react-native';

type PictureOptions = {
  quality?: number;
  base64?: boolean;
  exif?: boolean;
  skipProcessing?: boolean;
  onPictureSaved?: Function;
  // internal
  id?: number;
  fastMode?: boolean;
};

type RecordingOptions = {
  maxDuration?: number;
  maxFileSize?: number;
  quality?: number | string;
};

type CapturedPicture = {
  width: number;
  height: number;
  uri: string;
  base64?: string;
  exif?: any;
};

type PropsType = React.ComponentProps<typeof View> & {
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
  onMountError?: (event: { message: string }) => void;
  barCodeScannerSettings?: {};
  onBarCodeScanned?: (scanningResult: { type: string; data: string }) => void;
  faceDetectorSettings?: {};
  onFacesDetected?: (faces: { faces: any[] }) => void;
};

const CameraManager: any =
  NativeModulesProxy.ExponentCameraManager || NativeModulesProxy.ExponentCameraModule;

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

  static defaultProps: PropsType = {
    zoom: 0,
    ratio: '4:3',
    focusDepth: 0,
    faceDetectorSettings: {},
    type: CameraManager.Type.back,
    autoFocus: CameraManager.AutoFocus.on,
    flashMode: CameraManager.FlashMode.off,
    whiteBalance: CameraManager.WhiteBalance.auto,
  };

  _cameraHandle?: number | null;
  _cameraRef?: React.Component | null;
  _lastEvents: { [eventName: string]: string };
  _lastEventsTimes: { [eventName: string]: Date };

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
    if (Platform.OS === 'android') {
      return await CameraManager.getSupportedRatios(this._cameraHandle);
    } else {
      throw new Error('Ratio is not supported on iOS');
    }
  }

  async getAvailablePictureSizesAsync(ratio?: string): Promise<Array<string>> {
    return await CameraManager.getAvailablePictureSizes(ratio, this._cameraHandle);
  }

  async recordAsync(options?: RecordingOptions): Promise<{ uri: string }> {
    if (!options || typeof options !== 'object') {
      options = {};
    } else if (typeof options.quality === 'string') {
      options.quality = Camera.Constants.VideoQuality[options.quality];
    }
    return await CameraManager.record(options, this._cameraHandle);
  }

  stopRecording() {
    CameraManager.stopRecording(this._cameraHandle);
  }

  pausePreview() {
    CameraManager.pausePreview(this._cameraHandle);
  }

  resumePreview() {
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

  _onPictureSaved = ({ nativeEvent }: { nativeEvent: { data: CapturedPicture; id: number } }) => {
    const callback = _PICTURE_SAVED_CALLBACKS[nativeEvent.id];
    if (callback) {
      callback(nativeEvent.data);
      delete _PICTURE_SAVED_CALLBACKS[nativeEvent.id];
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
      this._cameraHandle = findNodeHandle(ref);
    } else {
      this._cameraRef = null;
      this._cameraHandle = null;
    }
  };

  render() {
    const nativeProps = this._convertNativeProps(this.props);

    return (
      <ExponentCamera
        {...nativeProps}
        ref={this._setReference}
        onCameraReady={this._onCameraReady}
        onMountError={this._onMountError}
        onPictureSaved={this._onPictureSaved}
        onBarCodeScanned={this._onObjectDetected(this.props.onBarCodeScanned)}
        onFacesDetected={this._onObjectDetected(this.props.onFacesDetected)}
      />
    );
  }

  _convertNativeProps(props: PropsType) {
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

    if (Platform.OS === 'ios') {
      delete newProps.ratio;
      delete newProps.useCamera2Api;
    }

    return newProps;
  }
}

const convertProp = (value: any, key: string): any => {
  if (typeof value === 'string' && Camera.ConversionTables[key]) {
    return Camera.ConversionTables[key][value];
  }

  return value;
}

export const Constants = Camera.Constants;

const ExponentCamera = requireNativeViewManager('ExponentCamera');
