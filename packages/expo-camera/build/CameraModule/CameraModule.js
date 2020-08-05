/* eslint-env browser */
import * as React from 'react';
import { CameraType, ImageType, } from './CameraModule.types';
import * as Utils from './CameraUtils';
import { FacingModeToCameraType } from './constants';
export { ImageType, CameraType };
const VALID_SETTINGS_KEYS = [
    'autoFocus',
    'flashMode',
    'exposureCompensation',
    'colorTemperature',
    'iso',
    'brightness',
    'contrast',
    'saturation',
    'sharpness',
    'focusDistance',
    'whiteBalance',
    'zoom',
];
function useLoadedVideo(video, onLoaded) {
    React.useEffect(() => {
        let mounted = true;
        video.current?.addEventListener?.('loadedmetadata', () => {
            // without this async block the constraints aren't properly applied to the camera,
            // this means that if you were to turn on the torch and swap to the front camera,
            // then swap back to the rear camera the torch setting wouldn't be applied.
            requestAnimationFrame(() => {
                if (mounted) {
                    onLoaded();
                }
            });
        });
        return () => {
            mounted = false;
        };
    }, [video.current]);
}
export function useCameraStream(video, type, settings, { onCameraReady, onMountError, }) {
    const stream = React.useRef(null);
    const streamSettings = React.useRef(null);
    const capabilities = React.useRef({
        autoFocus: 'continuous',
        flashMode: 'off',
        whiteBalance: 'continuous',
        zoom: 1,
    });
    const isStartingCamera = React.useRef(false);
    const [realType, setRealType] = React.useState(null);
    useLoadedVideo(video, () => {
        Utils.syncTrackCapabilities(type, stream.current, capabilities.current);
    });
    React.useEffect(() => {
        return () => {
            console.log('dismount');
            // unmount
            stopAsync();
        };
    }, []);
    React.useEffect(() => {
        resumePreview();
    }, [type]);
    React.useEffect(() => {
        const changes = {};
        for (const key of Object.keys(settings)) {
            if (!VALID_SETTINGS_KEYS.includes(key))
                continue;
            const nextValue = settings[key];
            if (nextValue !== capabilities.current[key]) {
                changes[key] = nextValue;
            }
        }
        // Only update the native camera if changes were found
        const hasChanges = !!Object.keys(changes).length;
        const nextWebCameraSettings = { ...capabilities.current, ...changes };
        if (hasChanges) {
            Utils.syncTrackCapabilities(type, stream.current, changes);
        }
        capabilities.current = nextWebCameraSettings;
    }, [
        settings.autoFocus,
        settings.flashMode,
        settings.exposureCompensation,
        settings.colorTemperature,
        settings.iso,
        settings.brightness,
        settings.contrast,
        settings.saturation,
        settings.sharpness,
        settings.focusDistance,
        settings.whiteBalance,
        settings.zoom,
    ]);
    React.useEffect(() => {
        streamSettings.current = stream.current ? stream.current.getTracks()[0].getSettings() : null;
        if (streamSettings.current) {
            // On desktop no value will be returned, in this case we should assume the cameraType is 'front'
            const { facingMode = 'user' } = streamSettings.current;
            setRealType(FacingModeToCameraType[facingMode]);
        }
        else {
            setRealType(null);
        }
        console.log('update settings: ', streamSettings.current);
    }, [stream.current]);
    React.useEffect(() => {
        if (!video.current) {
            return;
        }
        Utils.setVideoSource(video.current, stream.current);
    }, [stream.current, video.current]);
    const stopAsync = () => {
        console.log('stop', stream.current);
        Utils.stopMediaStream(stream.current);
        stream.current = null;
    };
    const resumePreview = async () => {
        console.log('resume', isStartingCamera.current);
        if (isStartingCamera.current) {
            return;
        }
        isStartingCamera.current = true;
        let streamDevice;
        try {
            streamDevice = await Utils.getStreamDevice(type);
        }
        catch (error) {
            // this can happen when the requested mode is not supported.
            isStartingCamera.current = false;
            onMountError?.({ nativeEvent: error });
            return;
        }
        if (Utils.compareStreams(streamDevice, stream.current)) {
            // Do nothing if the streams are the same.
            // This happens when the device only supports one camera (i.e. desktop) and the mode was toggled between front/back while already active.
            // Without this check there is a screen flash while the video switches.
            return;
        }
        stopAsync();
        stream.current = streamDevice; //await Utils.getStreamDevice(type);
        // syncTrackCapabilities(type, stream.current, capabilities.current);
        isStartingCamera.current = false;
        onCameraReady?.();
    };
    return {
        type: realType,
        resume: resumePreview,
        stop: stopAsync,
        capture(config) {
            return Utils.capture(video.current, streamSettings.current, config);
        },
    };
}
//# sourceMappingURL=CameraModule.js.map