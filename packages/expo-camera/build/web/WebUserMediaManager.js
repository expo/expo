/* eslint-env browser */
import { Platform } from 'expo-modules-core';
async function sourceSelectedAsync(isMuted, audioConstraints, videoConstraints) {
    const constraints = {
        video: typeof videoConstraints !== 'undefined' ? videoConstraints : true,
    };
    if (!isMuted) {
        constraints.audio = typeof audioConstraints !== 'undefined' ? audioConstraints : true;
    }
    return await getAnyUserMediaAsync(constraints);
}
export async function requestUserMediaAsync(props, isMuted = true) {
    return await sourceSelectedAsync(isMuted, props.audio, props.video);
}
export async function getAnyUserMediaAsync(constraints, ignoreConstraints = false) {
    try {
        return await navigator.mediaDevices.getUserMedia({
            ...constraints,
            video: ignoreConstraints || constraints.video,
        });
    }
    catch (error) {
        if (!ignoreConstraints &&
            typeof error === 'object' &&
            error?.name === 'ConstraintNotSatisfiedError') {
            return await getAnyUserMediaAsync(constraints, true);
        }
        throw error;
    }
}
export function canGetUserMedia() {
    return Platform.isDOMAvailable && !!navigator.mediaDevices?.getUserMedia;
}
export async function isFrontCameraAvailableAsync(devices) {
    return await supportsCameraType(['front', 'user', 'facetime'], 'user', devices);
}
export async function isBackCameraAvailableAsync(devices) {
    return await supportsCameraType(['back', 'rear'], 'environment', devices);
}
async function supportsCameraType(labels, type, devices) {
    if (!devices) {
        if (!navigator.mediaDevices.enumerateDevices) {
            return null;
        }
        devices = await navigator.mediaDevices.enumerateDevices();
    }
    const cameras = devices.filter((t) => t.kind === 'videoinput');
    const [hasCamera] = cameras.filter((camera) => labels.some((label) => camera.label.toLowerCase().includes(label)));
    const [isCapable] = cameras.filter((camera) => {
        if (!('getCapabilities' in camera)) {
            return null;
        }
        const capabilities = camera.getCapabilities();
        if (!capabilities.facingMode) {
            return null;
        }
        return capabilities.facingMode.find((_) => type);
    });
    return isCapable?.deviceId || hasCamera?.deviceId || null;
}
//# sourceMappingURL=WebUserMediaManager.js.map