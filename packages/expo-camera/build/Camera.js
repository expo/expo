import React from 'react';
import PropTypes from 'prop-types';
import mapValues from 'lodash.mapvalues';
import { NativeModulesProxy, requireNativeViewManager } from 'expo-core';
import { findNodeHandle, ViewPropTypes, Platform } from 'react-native';
const CameraManager = NativeModulesProxy.ExponentCameraManager || NativeModulesProxy.ExponentCameraModule;
const EventThrottleMs = 500;
const _PICTURE_SAVED_CALLBACKS = {};
let _GLOBAL_PICTURE_ID = 1;
export default class Camera extends React.Component {
    constructor(props) {
        super(props);
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
        this._onPictureSaved = ({ nativeEvent }) => {
            const callback = _PICTURE_SAVED_CALLBACKS[nativeEvent.id];
            if (callback) {
                callback(nativeEvent.data);
                delete _PICTURE_SAVED_CALLBACKS[nativeEvent.id];
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
                this._cameraHandle = findNodeHandle(ref);
            }
            else {
                this._cameraRef = null;
                this._cameraHandle = null;
            }
        };
        this._lastEvents = {};
        this._lastEventsTimes = {};
    }
    async takePictureAsync(options) {
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
    async getSupportedRatiosAsync() {
        if (Platform.OS === 'android') {
            return await CameraManager.getSupportedRatios(this._cameraHandle);
        }
        else {
            throw new Error('Ratio is not supported on iOS');
        }
    }
    async getAvailablePictureSizesAsync(ratio) {
        return await CameraManager.getAvailablePictureSizes(ratio, this._cameraHandle);
    }
    async recordAsync(options) {
        if (!options || typeof options !== 'object') {
            options = {};
        }
        else if (typeof options.quality === 'string') {
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
    render() {
        const nativeProps = this._convertNativeProps(this.props);
        return (<ExponentCamera {...nativeProps} ref={this._setReference} onCameraReady={this._onCameraReady} onMountError={this._onMountError} onPictureSaved={this._onPictureSaved} onBarCodeScanned={this._onObjectDetected(this.props.onBarCodeScanned)} onFacesDetected={this._onObjectDetected(this.props.onFacesDetected)}/>);
    }
    _convertNativeProps(props) {
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
Camera.propTypes = {
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
const convertProp = (value, key) => {
    if (typeof value === 'string' && Camera.ConversionTables[key]) {
        return Camera.ConversionTables[key][value];
    }
    return value;
};
export const Constants = Camera.Constants;
const ExponentCamera = requireNativeViewManager('ExponentCamera');
//# sourceMappingURL=Camera.js.map