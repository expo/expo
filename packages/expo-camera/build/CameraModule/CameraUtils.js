/* eslint-env browser */
import invariant from 'invariant';
import { CameraType, ImageType } from './CameraModule.types';
import { requestUserMediaAsync } from './UserMediaManager';
import { CameraTypeToFacingMode, ImageTypeFormat, MinimumConstraints } from './constants';
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
function ensureCaptureOptions(config) {
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
export function captureImage(video, pictureOptions) {
    const config = ensureCaptureOptions(pictureOptions);
    const { scale, imageType, quality = DEFAULT_QUALITY, isImageMirror } = config;
    const { videoWidth, videoHeight } = video;
    const { width, height } = getImageSize(videoWidth, videoHeight, scale);
    // Build the canvas size and draw the camera image to the context from video
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d');
    //TODO: Bacon: useless
    if (!context)
        throw new Error('Context is not defined');
    // Flip horizontally (as css transform: rotateY(180deg))
    if (isImageMirror) {
        context.setTransform(-1, 0, 0, 1, canvas.width, 0);
    }
    context.drawImage(video, 0, 0, width, height);
    const base64 = toDataURL(canvas, imageType, quality);
    return base64;
}
function getSupportedConstraints() {
    if (navigator.mediaDevices && navigator.mediaDevices.getSupportedConstraints) {
        return navigator.mediaDevices.getSupportedConstraints();
    }
    return null;
}
export function getIdealConstraints(preferredCameraType, width, height) {
    let preferredConstraints = {
        audio: false,
        video: {},
    };
    if (hasValidConstraints(preferredCameraType, width, height)) {
        return MinimumConstraints;
    }
    const supports = getSupportedConstraints();
    // TODO: Bacon: Test this
    if (!supports || !supports.facingMode || !supports.width || !supports.height)
        return MinimumConstraints;
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
export async function getStreamDevice(preferredCameraType, preferredWidth, preferredHeight) {
    const constraints = getIdealConstraints(preferredCameraType, preferredWidth, preferredHeight);
    const stream = await requestUserMediaAsync(constraints);
    return stream;
}
export function isWebKit() {
    return /WebKit/.test(navigator.userAgent) && !/Edg/.test(navigator.userAgent);
}
//# sourceMappingURL=CameraUtils.js.map