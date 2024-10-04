import { Platform, UnavailabilityError, EventEmitter } from 'expo-modules-core';
import * as React from 'react';
import ExpoCamera from './ExpoCamera';
import CameraManager from './ExpoCameraManager';
import { ConversionTables, ensureNativeProps } from './utils/props';
const emitter = new EventEmitter(CameraManager);
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
    return recordingOptions;
}
function _onPictureSaved({ nativeEvent, }) {
    const { id, data } = nativeEvent;
    const callback = _PICTURE_SAVED_CALLBACKS[id];
    if (callback) {
        callback(data);
        delete _PICTURE_SAVED_CALLBACKS[id];
    }
}
export default class CameraView extends React.Component {
    /**
     * Property that determines if the current device has the ability to use `DataScannerViewController` (iOS 16+).
     */
    static isModernBarcodeScannerAvailable = CameraManager.isModernBarcodeScannerAvailable;
    /**
     * Check whether the current device has a camera. This is useful for web and simulators cases.
     * This isn't influenced by the Permissions API (all platforms), or HTTP usage (in the browser).
     * You will still need to check if the native permission has been accepted.
     * @platform web
     */
    static async isAvailableAsync() {
        if (!CameraManager.isAvailableAsync) {
            throw new UnavailabilityError('expo-camera', 'isAvailableAsync');
        }
        return await CameraManager.isAvailableAsync();
    }
    // @needsAudit
    /**
     * Queries the device for the available video codecs that can be used in video recording.
     * @return A promise that resolves to a list of strings that represents available codecs.
     * @platform ios
     */
    static async getAvailableVideoCodecsAsync() {
        if (!CameraManager.getAvailableVideoCodecsAsync) {
            throw new UnavailabilityError('Camera', 'getAvailableVideoCodecsAsync');
        }
        return await CameraManager.getAvailableVideoCodecsAsync();
    }
    // Values under keys from this object will be transformed to native options
    static ConversionTables = ConversionTables;
    static defaultProps = {
        zoom: 0,
        type: 'back',
        enableTorch: false,
        mode: 'picture',
        flashMode: 'off',
    };
    _cameraHandle;
    _cameraRef = React.createRef();
    _lastEvents = {};
    _lastEventsTimes = {};
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
    async takePictureAsync(options) {
        const pictureOptions = ensurePictureOptions(options);
        return await this._cameraRef.current?.takePicture(pictureOptions);
    }
    /**
     * Presents a modal view controller that uses the `DataScannerViewController` available on iOS 16+.
     */
    static async launchModernScanner(options) {
        if (!options) {
            options = { barCodeTypes: [] };
        }
        if (Platform.OS === 'ios' && CameraView.isModernBarcodeScannerAvailable) {
            await CameraManager.launchScanner(options);
        }
    }
    /**
     * Dimiss `DataScannerViewController`
     */
    static async dismissScanner() {
        if (Platform.OS === 'ios' && CameraView.isModernBarcodeScannerAvailable) {
            await CameraManager.dismissScanner();
        }
    }
    static onModernBarcodeScanned(listener) {
        return emitter.addListener('onModernBarcodeScanned', listener);
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
    async recordAsync(options) {
        const recordingOptions = ensureRecordingOptions(options);
        return await this._cameraRef.current?.record(recordingOptions);
    }
    /**
     * Stops recording if any is in progress.
     */
    stopRecording() {
        this._cameraRef.current?.stopRecording();
    }
    _onCameraReady = () => {
        if (this.props.onCameraReady) {
            this.props.onCameraReady();
        }
    };
    _onMountError = ({ nativeEvent }) => {
        if (this.props.onMountError) {
            this.props.onMountError(nativeEvent);
        }
    };
    _onResponsiveOrientationChanged = ({ nativeEvent, }) => {
        if (this.props.onResponsiveOrientationChanged) {
            this.props.onResponsiveOrientationChanged(nativeEvent);
        }
    };
    _onObjectDetected = (callback) => ({ nativeEvent }) => {
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
    _setReference = (ref) => {
        if (ref) {
            // TODO(Bacon): Unify these - perhaps with hooks?
            if (Platform.OS === 'web') {
                this._cameraHandle = ref;
            }
        }
    };
    render() {
        const nativeProps = ensureNativeProps(this.props);
        const onBarcodeScanned = this.props.onBarcodeScanned
            ? this._onObjectDetected(this.props.onBarcodeScanned)
            : undefined;
        return (<ExpoCamera {...nativeProps} ref={this._cameraRef} onCameraReady={this._onCameraReady} onMountError={this._onMountError} onBarcodeScanned={onBarcodeScanned} onPictureSaved={_onPictureSaved} onResponsiveOrientationChanged={this._onResponsiveOrientationChanged}/>);
    }
}
//# sourceMappingURL=CameraView.js.map