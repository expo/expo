/* eslint-env browser */
import invariant from 'invariant';
import { CameraType, ImageType } from './CameraModule.types';
import * as Utils from './CameraUtils';
import * as CapabilityUtils from './CapabilityUtils';
import { FacingModeToCameraType, PictureSizes } from './constants';
import { isBackCameraAvailableAsync, isFrontCameraAvailableAsync } from './UserMediaManager';
export { ImageType, CameraType };
class CameraModule {
    constructor(videoElement) {
        this.stream = null;
        this.settings = null;
        this.onCameraReady = () => { };
        this.onMountError = () => { };
        this._isStartingCamera = false;
        this._autoFocus = 'continuous';
        this._flashMode = 'off';
        this._whiteBalance = 'continuous';
        this._cameraType = CameraType.front;
        this._zoom = 1;
        // TODO: Bacon: we don't even use ratio in native...
        this.getAvailablePictureSizes = async (ratio) => {
            return PictureSizes;
        };
        this.getAvailableCameraTypesAsync = async () => {
            if (!navigator.mediaDevices.enumerateDevices) {
                return [];
            }
            const devices = await navigator.mediaDevices.enumerateDevices();
            const types = await Promise.all([
                (await isFrontCameraAvailableAsync(devices)) && CameraType.front,
                (await isBackCameraAvailableAsync()) && CameraType.back,
            ]);
            return types.filter(Boolean);
        };
        this.videoElement = videoElement;
        if (this.videoElement) {
            this.videoElement.addEventListener('loadedmetadata', () => {
                this.syncTrackCapabilities();
            });
        }
    }
    get autoFocus() {
        return this._autoFocus;
    }
    async setAutoFocusAsync(value) {
        if (value === this.autoFocus) {
            return;
        }
        this._autoFocus = value;
        await this.syncTrackCapabilities();
    }
    get flashMode() {
        return this._flashMode;
    }
    async setFlashModeAsync(value) {
        if (value === this.flashMode) {
            return;
        }
        this._flashMode = value;
        await this.syncTrackCapabilities();
    }
    get whiteBalance() {
        return this._whiteBalance;
    }
    async setWhiteBalanceAsync(value) {
        if (value === this.whiteBalance) {
            return;
        }
        this._whiteBalance = value;
        await this.syncTrackCapabilities();
    }
    get type() {
        return this._cameraType;
    }
    async setTypeAsync(value) {
        if (value === this._cameraType) {
            return;
        }
        this._cameraType = value;
        await this.resumePreview();
    }
    get zoom() {
        return this._zoom;
    }
    async setZoomAsync(value) {
        if (value === this.zoom) {
            return;
        }
        //TODO: Bacon: IMP on non-android devices
        this._zoom = value;
        await this.syncTrackCapabilities();
    }
    setPictureSize(value) {
        if (value === this._pictureSize) {
            return;
        }
        invariant(PictureSizes.includes(value), `expo-camera: CameraModule.setPictureSize(): invalid size supplied ${value}, expected one of: ${PictureSizes.join(', ')}`);
        const [width, height] = value.split('x');
        //TODO: Bacon: IMP
        // eslint-disable-next-line
        const aspectRatio = parseFloat(width) / parseFloat(height);
        this._pictureSize = value;
    }
    isTorchAvailable() {
        return isCapabilityAvailable(this.videoElement, 'torch');
    }
    isZoomAvailable() {
        return isCapabilityAvailable(this.videoElement, 'zoom');
    }
    async onCapabilitiesReady(track) {
        const capabilities = track.getCapabilities();
        // Create an empty object because if you set a constraint that isn't available an error will be thrown.
        const constraints = {};
        if (capabilities.zoom) {
            const { min, max } = capabilities.zoom;
            const converted = convertRange(this._zoom, [min, max]);
            constraints.zoom = Math.min(max, Math.max(min, converted));
        }
        if (capabilities.focusMode) {
            constraints.focusMode = CapabilityUtils.convertAutoFocusJSONToNative(this.autoFocus);
        }
        if (capabilities.torch) {
            constraints.torch = CapabilityUtils.convertFlashModeJSONToNative(this.flashMode);
        }
        if (capabilities.whiteBalance) {
            constraints.whiteBalance = this.whiteBalance;
        }
        // Create max-res camera
        // if (capabilities.aspectRatio && capabilities.aspectRatio.max) {
        //   constraints.aspectRatio = capabilities.aspectRatio.max;
        // }
        await track.applyConstraints({ advanced: [constraints] });
    }
    async applyVideoConstraints(constraints) {
        if (!this.stream || !this.stream.getVideoTracks) {
            return false;
        }
        return await applyConstraints(this.stream.getVideoTracks(), constraints);
    }
    async applyAudioConstraints(constraints) {
        if (!this.stream || !this.stream.getAudioTracks) {
            return false;
        }
        return await applyConstraints(this.stream.getAudioTracks(), constraints);
    }
    async syncTrackCapabilities() {
        if (this.stream && this.stream.getVideoTracks) {
            await Promise.all(this.stream.getVideoTracks().map(track => this.onCapabilitiesReady(track)));
        }
    }
    setStream(stream) {
        this.stream = stream;
        this.settings = stream ? stream.getTracks()[0].getSettings() : null;
        setVideoSource(this.videoElement, stream);
    }
    getActualCameraType() {
        if (this.settings) {
            // On desktop no value will be returned, in this case we should assume the cameraType is 'front'
            const { facingMode = 'user' } = this.settings;
            return FacingModeToCameraType[facingMode];
        }
        return null;
    }
    async ensureCameraIsRunningAsync() {
        if (!this.stream) {
            await this.resumePreview();
        }
    }
    async resumePreview() {
        if (this._isStartingCamera) {
            return null;
        }
        this._isStartingCamera = true;
        try {
            this.stopAsync();
            const stream = await Utils.getStreamDevice(this.type);
            this.setStream(stream);
            this._isStartingCamera = false;
            this.onCameraReady();
            return stream;
        }
        catch (error) {
            this._isStartingCamera = false;
            this.onMountError({ nativeEvent: error });
        }
        return null;
    }
    takePicture(config) {
        const base64 = Utils.captureImage(this.videoElement, config);
        const capturedPicture = {
            uri: base64,
            base64,
            width: 0,
            height: 0,
        };
        if (this.settings) {
            const { width = 0, height = 0 } = this.settings;
            capturedPicture.width = width;
            capturedPicture.height = height;
            // TODO: Bacon: verify/enforce exif shape.
            capturedPicture.exif = this.settings;
        }
        if (config.onPictureSaved) {
            config.onPictureSaved({ nativeEvent: { data: capturedPicture, id: config.id } });
        }
        return capturedPicture;
    }
    stopAsync() {
        stopMediaStream(this.stream);
        this.setStream(null);
    }
}
function stopMediaStream(stream) {
    if (!stream)
        return;
    if (stream.getAudioTracks)
        stream.getAudioTracks().forEach(track => track.stop());
    if (stream.getVideoTracks)
        stream.getVideoTracks().forEach(track => track.stop());
    if (isMediaStreamTrack(stream))
        stream.stop();
}
function setVideoSource(video, stream) {
    try {
        video.srcObject = stream;
    }
    catch (_) {
        if (stream) {
            video.src = window.URL.createObjectURL(stream);
        }
        else if (typeof video.src === 'string') {
            window.URL.revokeObjectURL(video.src);
        }
    }
}
async function applyConstraints(tracks, constraints) {
    try {
        await Promise.all(tracks.map(async (track) => {
            await track.applyConstraints({ advanced: [constraints] });
        }));
        return true;
    }
    catch (_) {
        return false;
    }
}
function isCapabilityAvailable(video, keyName) {
    const stream = video.srcObject;
    if (stream instanceof MediaStream) {
        const videoTrack = stream.getVideoTracks()[0];
        if (typeof videoTrack.getCapabilities === 'undefined') {
            return false;
        }
        const capabilities = videoTrack.getCapabilities();
        return !!capabilities[keyName];
    }
    return false;
}
function isMediaStreamTrack(input) {
    return typeof input.stop === 'function';
}
function convertRange(value, r2, r1 = [0, 1]) {
    return ((value - r1[0]) * (r2[1] - r2[0])) / (r1[1] - r1[0]) + r2[0];
}
export default CameraModule;
//# sourceMappingURL=CameraModule.js.map