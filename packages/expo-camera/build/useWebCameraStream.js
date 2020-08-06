/* eslint-env browser */
import * as React from 'react';
import * as Utils from './WebCameraUtils';
import { FacingModeToCameraType } from './WebConstants';
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
        if (video.current) {
            video.current.addEventListener('loadedmetadata', () => {
                // without this async block the constraints aren't properly applied to the camera,
                // this means that if you were to turn on the torch and swap to the front camera,
                // then swap back to the rear camera the torch setting wouldn't be applied.
                requestAnimationFrame(() => {
                    if (mounted) {
                        onLoaded();
                    }
                });
            });
        }
        return () => {
            mounted = false;
        };
    }, [video.current]);
}
export function useWebCameraStream(video, preferredType, settings, { onCameraReady, onMountError, }) {
    const stream = React.useRef(null);
    const streamSettings = React.useRef(null);
    const capabilities = React.useRef({
        autoFocus: 'continuous',
        flashMode: 'off',
        whiteBalance: 'continuous',
        zoom: 1,
    });
    const isStartingCamera = React.useRef(false);
    const [type, setType] = React.useState(null);
    useLoadedVideo(video, () => {
        Utils.syncTrackCapabilities(preferredType, stream.current, capabilities.current);
    });
    React.useEffect(() => {
        return () => {
            // unmount
            stopAsync();
        };
    }, []);
    React.useEffect(() => {
        resumeAsync();
    }, [preferredType]);
    React.useEffect(() => {
        const changes = {};
        for (const key of Object.keys(settings)) {
            if (!VALID_SETTINGS_KEYS.includes(key)) {
                continue;
            }
            const nextValue = settings[key];
            if (nextValue !== capabilities.current[key]) {
                changes[key] = nextValue;
            }
        }
        // Only update the native camera if changes were found
        const hasChanges = !!Object.keys(changes).length;
        const nextWebCameraSettings = { ...capabilities.current, ...changes };
        if (hasChanges) {
            Utils.syncTrackCapabilities(preferredType, stream.current, changes);
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
            setType(FacingModeToCameraType[facingMode]);
        }
        else {
            setType(null);
        }
    }, [stream.current]);
    React.useEffect(() => {
        if (!video.current) {
            return;
        }
        Utils.setVideoSource(video.current, stream.current);
    }, [stream.current, video.current]);
    const stopAsync = () => {
        Utils.stopMediaStream(stream.current);
        stream.current = null;
    };
    const resumeAsync = async () => {
        if (isStartingCamera.current) {
            return;
        }
        isStartingCamera.current = true;
        let streamDevice;
        try {
            streamDevice = await Utils.getStreamDevice(preferredType);
        }
        catch (nativeEvent) {
            // this can happen when the requested mode is not supported.
            isStartingCamera.current = false;
            if (onMountError) {
                onMountError({ nativeEvent });
            }
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
        if (onCameraReady) {
            onCameraReady();
        }
    };
    return {
        type,
        resumeAsync,
        stopAsync,
        captureAsync(config) {
            return Utils.capture(video.current, streamSettings.current, config);
        },
    };
}
//# sourceMappingURL=useWebCameraStream.js.map