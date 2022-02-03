/* eslint-env browser */
import invariant from 'invariant';
import { CameraType, ImageType, } from './Camera.types';
import * as CapabilityUtils from './WebCapabilityUtils';
import { CameraTypeToFacingMode, ImageTypeFormat, MinimumConstraints } from './WebConstants';
import { requestUserMediaAsync } from './WebUserMediaManager';
export function getImageSize(videoWidth, videoHeight, scale) {
    const width = videoWidth * scale;
    const ratio = videoWidth / width;
    const height = videoHeight / ratio;
    return {
        width,
        height,
    };
}
export function toDataURL(canvas, imageType, quality) {
    invariant(Object.values(ImageType).includes(imageType), `expo-camera: ${imageType} is not a valid ImageType. Expected a string from: ${Object.values(ImageType).join(', ')}`);
    const format = ImageTypeFormat[imageType];
    if (imageType === ImageType.jpg) {
        invariant(quality <= 1 && quality >= 0, `expo-camera: ${quality} is not a valid image quality. Expected a number from 0...1`);
        return canvas.toDataURL(format, quality);
    }
    else {
        return canvas.toDataURL(format);
    }
}
export function hasValidConstraints(preferredCameraType, width, height) {
    return preferredCameraType !== undefined && width !== undefined && height !== undefined;
}
function ensureCameraPictureOptions(config) {
    const captureOptions = {
        scale: 1,
        imageType: ImageType.png,
        isImageMirror: false,
    };
    for (const key in config) {
        if (key in config && config[key] !== undefined && key in captureOptions) {
            captureOptions[key] = config[key];
        }
    }
    return captureOptions;
}
const DEFAULT_QUALITY = 0.92;
export function captureImageData(video, pictureOptions = {}) {
    if (!video || video.readyState !== video.HAVE_ENOUGH_DATA) {
        return null;
    }
    const canvas = captureImageContext(video, pictureOptions);
    const context = canvas.getContext('2d', { alpha: false });
    if (!context || !canvas.width || !canvas.height) {
        return null;
    }
    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    return imageData;
}
export function captureImageContext(video, { scale = 1, isImageMirror = false }) {
    const { videoWidth, videoHeight } = video;
    const { width, height } = getImageSize(videoWidth, videoHeight, scale);
    // Build the canvas size and draw the camera image to the context from video
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d', { alpha: false });
    if (!context) {
        // Should never be called
        throw new Error('Context is not defined');
    }
    // sharp image details
    // context.imageSmoothingEnabled = false;
    // Flip horizontally (as css transform: rotateY(180deg))
    if (isImageMirror) {
        context.setTransform(-1, 0, 0, 1, canvas.width, 0);
    }
    context.drawImage(video, 0, 0, width, height);
    return canvas;
}
export function captureImage(video, pictureOptions) {
    const config = ensureCameraPictureOptions(pictureOptions);
    const canvas = captureImageContext(video, config);
    const { imageType, quality = DEFAULT_QUALITY } = config;
    return toDataURL(canvas, imageType, quality);
}
function getSupportedConstraints() {
    if (navigator.mediaDevices && navigator.mediaDevices.getSupportedConstraints) {
        return navigator.mediaDevices.getSupportedConstraints();
    }
    return null;
}
export function getIdealConstraints(preferredCameraType, width, height) {
    const preferredConstraints = {
        audio: false,
        video: {},
    };
    if (hasValidConstraints(preferredCameraType, width, height)) {
        return MinimumConstraints;
    }
    const supports = getSupportedConstraints();
    // TODO(Bacon): Test this
    if (!supports || !supports.facingMode || !supports.width || !supports.height) {
        return MinimumConstraints;
    }
    if (preferredCameraType && Object.values(CameraType).includes(preferredCameraType)) {
        const facingMode = CameraTypeToFacingMode[preferredCameraType];
        if (isWebKit()) {
            const key = facingMode === 'user' ? 'exact' : 'ideal';
            preferredConstraints.video.facingMode = {
                [key]: facingMode,
            };
        }
        else {
            preferredConstraints.video.facingMode = {
                ideal: CameraTypeToFacingMode[preferredCameraType],
            };
        }
    }
    if (isMediaTrackConstraints(preferredConstraints.video)) {
        preferredConstraints.video.width = width;
        preferredConstraints.video.height = height;
    }
    return preferredConstraints;
}
function isMediaTrackConstraints(input) {
    return input && typeof input.video !== 'boolean';
}
/**
 * Invoke getStreamDevice a second time with the opposing camera type if the preferred type cannot be retrieved.
 *
 * @param preferredCameraType
 * @param preferredWidth
 * @param preferredHeight
 */
export async function getPreferredStreamDevice(preferredCameraType, preferredWidth, preferredHeight) {
    try {
        return await getStreamDevice(preferredCameraType, preferredWidth, preferredHeight);
    }
    catch (error) {
        // A hack on desktop browsers to ensure any camera is used.
        // eslint-disable-next-line no-undef
        if (error instanceof OverconstrainedError && error.constraint === 'facingMode') {
            const nextCameraType = preferredCameraType === CameraType.back ? CameraType.front : CameraType.back;
            return await getStreamDevice(nextCameraType, preferredWidth, preferredHeight);
        }
        throw error;
    }
}
export async function getStreamDevice(preferredCameraType, preferredWidth, preferredHeight) {
    const constraints = getIdealConstraints(preferredCameraType, preferredWidth, preferredHeight);
    const stream = await requestUserMediaAsync(constraints);
    return stream;
}
export function isWebKit() {
    return /WebKit/.test(navigator.userAgent) && !/Edg/.test(navigator.userAgent);
}
export function compareStreams(a, b) {
    if (!a || !b) {
        return false;
    }
    const settingsA = a.getTracks()[0].getSettings();
    const settingsB = b.getTracks()[0].getSettings();
    return settingsA.deviceId === settingsB.deviceId;
}
export function capture(video, settings, config) {
    const base64 = captureImage(video, config);
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
        capturedPicture.exif = settings;
    }
    if (config.onPictureSaved) {
        config.onPictureSaved(capturedPicture);
    }
    return capturedPicture;
}
export async function syncTrackCapabilities(cameraType, stream, settings = {}) {
    if (stream?.getVideoTracks) {
        await Promise.all(stream.getVideoTracks().map((track) => onCapabilitiesReady(cameraType, track, settings)));
    }
}
// https://developer.mozilla.org/en-US/docs/Web/API/MediaTrackConstraints
async function onCapabilitiesReady(cameraType, track, settings = {}) {
    const capabilities = track.getCapabilities();
    // Create an empty object because if you set a constraint that isn't available an error will be thrown.
    const constraints = {};
    // TODO(Bacon): Add `pointsOfInterest` support
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
    function validatedInternalConstrainedValue(constraintKey, settingsKey, converter) {
        const convertedSetting = converter(settings[settingsKey]);
        return validatedConstrainedValue({
            constraintKey,
            settingsKey,
            convertedSetting,
            capabilities,
            settings,
            cameraType,
        });
    }
    if (capabilities.focusMode && settings.autoFocus !== undefined) {
        constraints.focusMode = validatedInternalConstrainedValue('focusMode', 'autoFocus', CapabilityUtils.convertAutoFocusJSONToNative);
    }
    if (capabilities.torch && settings.flashMode !== undefined) {
        constraints.torch = validatedInternalConstrainedValue('torch', 'flashMode', CapabilityUtils.convertFlashModeJSONToNative);
    }
    if (capabilities.whiteBalanceMode && settings.whiteBalance !== undefined) {
        constraints.whiteBalanceMode = validatedInternalConstrainedValue('whiteBalanceMode', 'whiteBalance', CapabilityUtils.convertWhiteBalanceJSONToNative);
    }
    try {
        await track.applyConstraints({ advanced: [constraints] });
    }
    catch (error) {
        if (__DEV__)
            console.warn('Failed to apply constraints', error);
    }
}
export function stopMediaStream(stream) {
    if (!stream) {
        return;
    }
    if (stream.getAudioTracks) {
        stream.getAudioTracks().forEach((track) => track.stop());
    }
    if (stream.getVideoTracks) {
        stream.getVideoTracks().forEach((track) => track.stop());
    }
    if (isMediaStreamTrack(stream)) {
        stream.stop();
    }
}
export function setVideoSource(video, stream) {
    const createObjectURL = window.URL.createObjectURL ?? window.webkitURL.createObjectURL;
    if (typeof video.srcObject !== 'undefined') {
        video.srcObject = stream;
    }
    else if (typeof video.mozSrcObject !== 'undefined') {
        video.mozSrcObject = stream;
    }
    else if (stream && createObjectURL) {
        video.src = createObjectURL(stream);
    }
    if (!stream) {
        const revokeObjectURL = window.URL.revokeObjectURL ?? window.webkitURL.revokeObjectURL;
        const source = video.src ?? video.srcObject ?? video.mozSrcObject;
        if (revokeObjectURL && typeof source === 'string') {
            revokeObjectURL(source);
        }
    }
}
export function isCapabilityAvailable(video, keyName) {
    const stream = video.srcObject;
    if (stream instanceof MediaStream) {
        const videoTrack = stream.getVideoTracks()[0];
        return videoTrack.getCapabilities?.()?.[keyName];
    }
    return false;
}
function isMediaStreamTrack(input) {
    return typeof input.stop === 'function';
}
function convertNormalizedSetting(range, value) {
    if (!value) {
        return;
    }
    // convert the normalized incoming setting to the native camera zoom range
    const converted = convertRange(value, [range.min, range.max]);
    // clamp value so we don't get an error
    return Math.min(range.max, Math.max(range.min, converted));
}
function convertRange(value, r2, r1 = [0, 1]) {
    return ((value - r1[0]) * (r2[1] - r2[0])) / (r1[1] - r1[0]) + r2[0];
}
function validatedConstrainedValue(props) {
    const { constraintKey, settingsKey, convertedSetting, capabilities, settings, cameraType } = props;
    const setting = settings[settingsKey];
    if (Array.isArray(capabilities[constraintKey]) &&
        convertedSetting &&
        !capabilities[constraintKey].includes(convertedSetting)) {
        if (__DEV__) {
            // Only warn in dev mode.
            console.warn(` { ${settingsKey}: "${setting}" } (converted to "${convertedSetting}" in the browser) is not supported for camera type "${cameraType}" in your browser. Using the default value instead.`);
        }
        return undefined;
    }
    return convertedSetting;
}
//# sourceMappingURL=WebCameraUtils.js.map