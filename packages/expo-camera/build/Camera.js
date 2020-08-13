import { Platform, UnavailabilityError } from '@unimodules/core';
import mapValues from 'lodash/mapValues';
import * as React from 'react';
import { findNodeHandle } from 'react-native';
import { PermissionStatus, } from './Camera.types';
import ExponentCamera from './ExponentCamera';
import CameraManager from './ExponentCameraManager';
const EventThrottleMs = 500;
const _PICTURE_SAVED_CALLBACKS = {};
let _GLOBAL_PICTURE_ID = 1;
function ensurePictureOptions(options) {
    const pictureOptions = !options || typeof options !== 'object' ? {} : options;
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
function ensureRecordingOptions(options) {
    let recordingOptions = options || {};
    if (!recordingOptions || typeof recordingOptions !== 'object') {
        recordingOptions = {};
    }
    else if (typeof recordingOptions.quality === 'string') {
        recordingOptions.quality = Camera.Constants.VideoQuality[recordingOptions.quality];
    }
    return recordingOptions;
}
function ensureNativeProps(options) {
    let props = options || {};
    if (!props || typeof props !== 'object') {
        props = {};
    }
    const newProps = mapValues(props, convertProp);
    const propsKeys = Object.keys(newProps);
    // barCodeTypes is deprecated
    if (!propsKeys.includes('barCodeScannerSettings') && propsKeys.includes('barCodeTypes')) {
        if (__DEV__) {
            console.warn(`The "barCodeTypes" prop for Camera is deprecated and will be removed in SDK 34. Use "barCodeScannerSettings" instead.`);
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
function convertProp(value, key) {
    if (typeof value === 'string' && Camera.ConversionTables[key]) {
        return Camera.ConversionTables[key][value];
    }
    return value;
}
function _onPictureSaved({ nativeEvent, }) {
    const { id, data } = nativeEvent;
    const callback = _PICTURE_SAVED_CALLBACKS[id];
    if (callback) {
        callback(data);
        delete _PICTURE_SAVED_CALLBACKS[id];
    }
}
let Camera = /** @class */ (() => {
    class Camera extends React.Component {
        constructor() {
            super(...arguments);
            this._lastEvents = {};
            this._lastEventsTimes = {};
            this._onCameraReady = () => {
                if (this.props.onCameraReady) {
                    this.props.onCameraReady();
                }
            };
            this._onMountError = ({ nativeEvent }) => {
                if (this.props.onMountError) {
                    this.props.onMountError(nativeEvent);
                }
            };
            this._onObjectDetected = (callback) => ({ nativeEvent }) => {
                const { type } = nativeEvent;
                if (this._lastEvents[type] &&
                    this._lastEventsTimes[type] &&
                    JSON.stringify(nativeEvent) === this._lastEvents[type] &&
                    new Date().getTime() - this._lastEventsTimes[type].getTime() < EventThrottleMs) {
                    return;
                }
                if (callback) {
                    callback(nativeEvent);
                    this._lastEventsTimes[type] = new Date();
                    this._lastEvents[type] = JSON.stringify(nativeEvent);
                }
            };
            this._setReference = (ref) => {
                if (ref) {
                    this._cameraRef = ref;
                    // TODO(Bacon): Unify these - perhaps with hooks?
                    if (Platform.OS === 'web') {
                        this._cameraHandle = ref;
                    }
                    else {
                        this._cameraHandle = findNodeHandle(ref);
                    }
                }
                else {
                    this._cameraRef = null;
                    this._cameraHandle = null;
                }
            };
        }
        static async isAvailableAsync() {
            if (!CameraManager.isAvailableAsync) {
                throw new UnavailabilityError('expo-camera', 'isAvailableAsync');
            }
            return await CameraManager.isAvailableAsync();
        }
        static async getAvailableCameraTypesAsync() {
            if (!CameraManager.getAvailableCameraTypesAsync) {
                throw new UnavailabilityError('expo-camera', 'getAvailableCameraTypesAsync');
            }
            return await CameraManager.getAvailableCameraTypesAsync();
        }
        static async getPermissionsAsync() {
            return CameraManager.getPermissionsAsync();
        }
        static async requestPermissionsAsync() {
            return CameraManager.requestPermissionsAsync();
        }
        async takePictureAsync(options) {
            const pictureOptions = ensurePictureOptions(options);
            return await CameraManager.takePicture(pictureOptions, this._cameraHandle);
        }
        async getSupportedRatiosAsync() {
            if (!CameraManager.getSupportedRatios) {
                throw new UnavailabilityError('Camera', 'getSupportedRatiosAsync');
            }
            return await CameraManager.getSupportedRatios(this._cameraHandle);
        }
        async getAvailablePictureSizesAsync(ratio) {
            if (!CameraManager.getAvailablePictureSizes) {
                throw new UnavailabilityError('Camera', 'getAvailablePictureSizesAsync');
            }
            return await CameraManager.getAvailablePictureSizes(ratio, this._cameraHandle);
        }
        async recordAsync(options) {
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
        render() {
            const nativeProps = ensureNativeProps(this.props);
            const onBarCodeScanned = this.props.onBarCodeScanned
                ? this._onObjectDetected(this.props.onBarCodeScanned)
                : undefined;
            const onFacesDetected = this._onObjectDetected(this.props.onFacesDetected);
            return (React.createElement(ExponentCamera, Object.assign({}, nativeProps, { ref: this._setReference, onCameraReady: this._onCameraReady, onMountError: this._onMountError, onBarCodeScanned: onBarCodeScanned, onFacesDetected: onFacesDetected, onPictureSaved: _onPictureSaved })));
        }
    }
    Camera.Constants = {
        Type: CameraManager.Type,
        FlashMode: CameraManager.FlashMode,
        AutoFocus: CameraManager.AutoFocus,
        WhiteBalance: CameraManager.WhiteBalance,
        VideoQuality: CameraManager.VideoQuality,
        VideoStabilization: CameraManager.VideoStabilization || {},
    };
    // Values under keys from this object will be transformed to native options
    Camera.ConversionTables = {
        type: CameraManager.Type,
        flashMode: CameraManager.FlashMode,
        autoFocus: CameraManager.AutoFocus,
        whiteBalance: CameraManager.WhiteBalance,
    };
    Camera.defaultProps = {
        zoom: 0,
        ratio: '4:3',
        focusDepth: 0,
        faceDetectorSettings: {},
        type: CameraManager.Type.back,
        autoFocus: CameraManager.AutoFocus.on,
        flashMode: CameraManager.FlashMode.off,
        whiteBalance: CameraManager.WhiteBalance.auto,
    };
    return Camera;
})();
export default Camera;
export const { Constants, getPermissionsAsync, requestPermissionsAsync } = Camera;
export { PermissionStatus, };
//# sourceMappingURL=Camera.js.map