import { createPermissionHook, Platform, UnavailabilityError } from 'expo-modules-core';
import * as React from 'react';
import { findNodeHandle } from 'react-native';

import {
  CameraCapturedPicture,
  CameraOrientation,
  CameraPictureOptions,
  CameraProps,
  CameraRecordingOptions,
  CameraType,
  ConstantsType,
  PermissionResponse,
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
  /**
   * Check whether the current device has a camera. This is useful for web and simulators cases.
   * This isn't influenced by the Permissions API (all platforms), or HTTP usage (in the browser).
   * You will still need to check if the native permission has been accepted.
   * @platform web
   */
  static async isAvailableAsync(): Promise<boolean> {
    if (!CameraManager.isAvailableAsync) {
      throw new UnavailabilityError('expo-camera', 'isAvailableAsync');
    }

    return await CameraManager.isAvailableAsync();
  }

  /**
   * Returns a list of camera types `['front', 'back']`. This is useful for desktop browsers which only have front-facing cameras.
   * @platform web
   */
  static async getAvailableCameraTypesAsync(): Promise<CameraType[]> {
    if (!CameraManager.getAvailableCameraTypesAsync) {
      throw new UnavailabilityError('expo-camera', 'getAvailableCameraTypesAsync');
    }

    return await CameraManager.getAvailableCameraTypesAsync();
  }

  // @needsAudit
  /**
   * Queries the device for the available video codecs that can be used in video recording.
   * @return A promise that resolves to a list of strings that represents available codecs.
   * @platform ios
   */
  static async getAvailableVideoCodecsAsync(): Promise<VideoCodec[]> {
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

  // @needsAudit
  /**
   * @deprecated Use `getCameraPermissionsAsync` or `getMicrophonePermissionsAsync` instead.
   * Checks user's permissions for accessing camera.
   */
  static async getPermissionsAsync(): Promise<PermissionResponse> {
    console.warn(
      `"getPermissionsAsync()" is now deprecated. Please use "getCameraPermissionsAsync()" or "getMicrophonePermissionsAsync()" instead.`
    );
    return CameraManager.getPermissionsAsync();
  }

  // @needsAudit
  /**
   * Asks the user to grant permissions for accessing camera.
   * On iOS this will require apps to specify both `NSCameraUsageDescription` and `NSMicrophoneUsageDescription` entries in the **Info.plist**.
   * @return A promise that resolves to an object of type [PermissionResponse](#permissionresponse).
   * @deprecated Use `requestCameraPermissionsAsync` or `requestMicrophonePermissionsAsync` instead.
   */
  static async requestPermissionsAsync(): Promise<PermissionResponse> {
    console.warn(
      `"requestPermissionsAsync()" is now deprecated. Please use "requestCameraPermissionsAsync()" or "requestMicrophonePermissionsAsync()" instead.`
    );
    return CameraManager.requestPermissionsAsync();
  }

  // @needsAudit
  /**
   * Checks user's permissions for accessing camera.
   * @return A promise that resolves to an object of type [PermissionResponse](#permissionresponse).
   */
  static async getCameraPermissionsAsync(): Promise<PermissionResponse> {
    return CameraManager.getCameraPermissionsAsync();
  }

  // @needsAudit
  /**
   * Asks the user to grant permissions for accessing camera.
   * On iOS this will require apps to specify an `NSCameraUsageDescription` entry in the **Info.plist**.
   * @return A promise that resolves to an object of type [PermissionResponse](#permissionresponse).
   */
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

  // @needsAudit
  /**
   * Checks user's permissions for accessing microphone.
   * @return A promise that resolves to an object of type [PermissionResponse](#permissionresponse).
   */
  static async getMicrophonePermissionsAsync(): Promise<PermissionResponse> {
    return CameraManager.getMicrophonePermissionsAsync();
  }

  // @needsAudit
  /**
   * Asks the user to grant permissions for accessing the microphone.
   * On iOS this will require apps to specify an `NSMicrophoneUsageDescription` entry in the **Info.plist**.
   * @return A promise that resolves to an object of type [PermissionResponse](#permissionresponse).
   */
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

  // @needsAudit
  /**
   * Takes a picture and saves it to app's cache directory. Photos are rotated to match device's orientation
   * (if `options.skipProcessing` flag is not enabled) and scaled to match the preview. Anyway on Android it is essential
   * to set ratio prop to get a picture with correct dimensions.
   * > **Note**: Make sure to wait for the [`onCameraReady`](#oncameraready) callback before calling this method.
   * @param options An object in form of `CameraPictureOptions` type.
   * @return Returns a Promise that resolves to `CameraCapturedPicture` object, where `uri` is a URI to the local image file on iOS,
   * Android, and a base64 string on web (usable as the source for an `Image` element). The `width` and `height` properties specify
   * the dimensions of the image. `base64` is included if the `base64` option was truthy, and is a string containing the JPEG data
   * of the image in Base64--prepend that with `'data:image/jpg;base64,'` to get a data URI, which you can use as the source
   * for an `Image` element for example. `exif` is included if the `exif` option was truthy, and is an object containing EXIF
   * data for the image--the names of its properties are EXIF tags and their values are the values for those tags.
   *
   * > On native platforms, the local image URI is temporary. Use [`FileSystem.copyAsync`](filesystem.md#filesystemcopyasyncoptions)
   * > to make a permanent copy of the image.
   */
  async takePictureAsync(options?: CameraPictureOptions): Promise<CameraCapturedPicture> {
    const pictureOptions = ensurePictureOptions(options);

    return await CameraManager.takePicture(pictureOptions, this._cameraHandle);
  }

  /**
   * Get aspect ratios that are supported by the device and can be passed via `ratio` prop.
   * @return Returns a Promise that resolves to an array of strings representing ratios, eg. `['4:3', '1:1']`.
   * @platform android
   */
  async getSupportedRatiosAsync(): Promise<string[]> {
    if (!CameraManager.getSupportedRatios) {
      throw new UnavailabilityError('Camera', 'getSupportedRatiosAsync');
    }

    return await CameraManager.getSupportedRatios(this._cameraHandle);
  }

  /**
   * Get picture sizes that are supported by the device for given `ratio`.
   * @param ratio A string representing aspect ratio of sizes to be returned.
   * @return Returns a Promise that resolves to an array of strings representing picture sizes that can be passed to `pictureSize` prop.
   * The list varies across Android devices but is the same for every iOS.
   */
  async getAvailablePictureSizesAsync(ratio?: string): Promise<string[]> {
    if (!CameraManager.getAvailablePictureSizes) {
      throw new UnavailabilityError('Camera', 'getAvailablePictureSizesAsync');
    }
    return await CameraManager.getAvailablePictureSizes(ratio, this._cameraHandle);
  }

  /**
   * Starts recording a video that will be saved to cache directory. Videos are rotated to match device's orientation.
   * Flipping camera during a recording results in stopping it.
   * @param options A map of `CameraRecordingOptions` type.
   * @return Returns a Promise that resolves to an object containing video file `uri` property and a `codec` property on iOS.
   * The Promise is returned if `stopRecording` was invoked, one of `maxDuration` and `maxFileSize` is reached or camera preview is stopped.
   * @platform android
   * @platform ios
   */
  async recordAsync(options?: CameraRecordingOptions): Promise<{ uri: string }> {
    if (!CameraManager.record) {
      throw new UnavailabilityError('Camera', 'recordAsync');
    }

    const recordingOptions = ensureRecordingOptions(options);
    return await CameraManager.record(recordingOptions, this._cameraHandle);
  }

  /**
   * Stops recording if any is in progress.
   */
  stopRecording() {
    if (!CameraManager.stopRecording) {
      throw new UnavailabilityError('Camera', 'stopRecording');
    }

    CameraManager.stopRecording(this._cameraHandle);
  }

  /**
   * Pauses the camera preview. It is not recommended to use `takePictureAsync` when preview is paused.
   */
  pausePreview() {
    if (!CameraManager.pausePreview) {
      throw new UnavailabilityError('Camera', 'pausePreview');
    }

    CameraManager.pausePreview(this._cameraHandle);
  }

  /**
   * Resumes the camera preview.
   */
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

  _onResponsiveOrientationChanged = ({
    nativeEvent,
  }: {
    nativeEvent: { orientation: CameraOrientation };
  }) => {
    if (this.props.onResponsiveOrientationChanged) {
      this.props.onResponsiveOrientationChanged(nativeEvent);
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
        onResponsiveOrientationChanged={this._onResponsiveOrientationChanged}
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
