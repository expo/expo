/* eslint-env browser */
import * as React from 'react';
import { CameraType, ImageType } from './CameraModule.types';
import * as Utils from './CameraUtils';
import * as CapabilityUtils from './CapabilityUtils';
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
        syncTrackCapabilities(type, stream.current, capabilities.current);
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
            syncTrackCapabilities(type, stream.current, changes);
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
        setVideoSource(video.current, stream.current);
    }, [stream.current, video.current]);
    const stopAsync = () => {
        console.log('stop', stream.current);
        stopMediaStream(stream.current);
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
        if (compareStreams(streamDevice, stream.current)) {
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
            return capture(video.current, streamSettings.current, config);
        },
    };
}
function compareStreams(a, b) {
    if (!a || !b)
        return false;
    const settingsA = a.getTracks()[0].getSettings();
    const settingsB = b.getTracks()[0].getSettings();
    return settingsA.deviceId === settingsB.deviceId;
}
function capture(video, settings, config) {
    const base64 = Utils.captureImage(video, config);
    const capturedPicture = {
        uri: base64,
        base64,
        width: 0,
        height: 0,
    };
    if (settings) {
        const { width = 0, height = 0 } = settings;
        capturedPicture.width = width;
        capturedPicture.height = height;
        // TODO: Bacon: verify/enforce exif shape.
        capturedPicture.exif = settings;
    }
    if (config.onPictureSaved) {
        config.onPictureSaved({ nativeEvent: { data: capturedPicture, id: config.id } });
    }
    return capturedPicture;
}
async function syncTrackCapabilities(cameraType, stream, settings = {}) {
    if (stream?.getVideoTracks) {
        await Promise.all(stream.getVideoTracks().map(track => onCapabilitiesReady(cameraType, track, settings)));
    }
}
// https://developer.mozilla.org/en-US/docs/Web/API/MediaTrackConstraints
async function onCapabilitiesReady(cameraType, track, settings = {}) {
    console.log('sync: ', cameraType, settings);
    const capabilities = track.getCapabilities();
    // Create an empty object because if you set a constraint that isn't available an error will be thrown.
    const constraints = {};
    // TODO: Bacon: Add `pointsOfInterest` support
    const clampedValues = [
        'exposureCompensation',
        'colorTemperature',
        'iso',
        'brightness',
        'contrast',
        'saturation',
        'sharpness',
        'focusDistance',
        'zoom',
    ];
    for (const property of clampedValues) {
        if (capabilities[property]) {
            constraints[property] = convertNormalizedSetting(capabilities[property], settings[property]);
        }
    }
    const _validatedConstrainedValue = (key, propName, converter) => validatedConstrainedValue(key, propName, converter(settings[propName]), capabilities, settings, cameraType);
    if (capabilities.focusMode && settings.autoFocus !== undefined) {
        constraints.focusMode = _validatedConstrainedValue('focusMode', 'autoFocus', CapabilityUtils.convertAutoFocusJSONToNative);
    }
    console.log('can use torch: ', capabilities.torch);
    if (capabilities.torch && settings.flashMode !== undefined) {
        constraints.torch = _validatedConstrainedValue('torch', 'flashMode', CapabilityUtils.convertFlashModeJSONToNative);
    }
    if (capabilities.whiteBalanceMode && settings.whiteBalance !== undefined) {
        constraints.whiteBalanceMode = _validatedConstrainedValue('whiteBalanceMode', 'whiteBalance', CapabilityUtils.convertWhiteBalanceJSONToNative);
    }
    console.log('apply constraints: ', constraints);
    await track.applyConstraints({ advanced: [constraints] });
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
    catch {
        if (stream) {
            video.src = window.URL.createObjectURL(stream);
        }
        else if (typeof video.src === 'string') {
            window.URL.revokeObjectURL(video.src);
        }
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
function convertNormalizedSetting(range, value) {
    if (!value)
        return;
    // convert the normalized incoming setting to the native camera zoom range
    const converted = convertRange(value, [range.min, range.max]);
    // clamp value so we don't get an error
    return Math.min(range.max, Math.max(range.min, converted));
}
function convertRange(value, r2, r1 = [0, 1]) {
    return ((value - r1[0]) * (r2[1] - r2[0])) / (r1[1] - r1[0]) + r2[0];
}
function validatedConstrainedValue(constraintKey, settingsKey, convertedSetting, capabilities, settings, cameraType) {
    const setting = settings[settingsKey];
    if (Array.isArray(capabilities[constraintKey]) &&
        convertedSetting &&
        !capabilities[constraintKey].includes(convertedSetting)) {
        console.warn(` { ${settingsKey}: "${setting}" } (converted to "${convertedSetting}" in the browser) is not supported for camera type "${cameraType}" in your browser. Using the default value instead.`);
        return undefined;
    }
    return convertedSetting;
}
//# sourceMappingURL=CameraModule.js.map