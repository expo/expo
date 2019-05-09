import invariant from 'invariant';
import { CameraType, ImageType } from './CameraModule.types';
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
export function captureImageContext(video, config) {
    const { scale, isImageMirror } = config;
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
    context.imageSmoothingEnabled = true;
    context.drawImage(video, 0, 0, width, height);
    return canvas;
}
export function captureImage(video, pictureOptions) {
    const config = ensureCaptureOptions(pictureOptions);
    const canvas = captureImageContext(video, config);
    const { imageType, quality = DEFAULT_QUALITY } = config;
    return toDataURL(canvas, imageType, quality);
}
export function captureImageData(video, pictureOptions = {}) {
    const config = ensureCaptureOptions(pictureOptions);
    const canvas = captureImageContext(video, config);
    const context = canvas.getContext('2d');
    if (!context || !canvas.width || !canvas.height) {
        return null;
    }
    // const image = new Image();
    // image.src = require('./qr.png');
    // context.drawImage(image, 0, 0);
    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    return imageData;
}
function getUserMedia(constraints) {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        return navigator.mediaDevices.getUserMedia(constraints);
    }
    else {
        let _getUserMedia = navigator['mozGetUserMedia'] || navigator['webkitGetUserMedia'];
        return new Promise((resolve, reject) => _getUserMedia.call(navigator, constraints, resolve, reject));
    }
}
function getSupportedConstraints() {
    if (navigator.mediaDevices && navigator.mediaDevices.getSupportedConstraints) {
        return navigator.mediaDevices.getSupportedConstraints();
    }
    return {};
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
    if (!supports.facingMode || !supports.width || !supports.height) {
        return MinimumConstraints;
    }
    if (preferredCameraType && Object.values(CameraType).includes(preferredCameraType)) {
        preferredConstraints.video.facingMode = {
            ideal: CameraTypeToFacingMode[preferredCameraType],
        };
    }
    preferredConstraints.video.width = width;
    preferredConstraints.video.height = height;
    return preferredConstraints;
}
export async function getStreamDevice(preferredCameraType, preferredWidth, preferredHeight) {
    const constraints = getIdealConstraints(preferredCameraType, preferredWidth, preferredHeight);
    const stream = await getUserMedia(constraints);
    return stream;
}
function drawCorner(ctx, x, y, angle) {
    const size = 50;
    const h = size / 2;
    ctx.save();
    ctx.translate(x, y);
    // ctx.translate(size / 2, size / 2);
    ctx.beginPath();
    ctx.fillStyle = 'blue';
    ctx.arc(0, 0, 10, 0, 2 * Math.PI); // Start point
    ctx.fill();
    ctx.rotate(angle);
    ctx.translate(-h, -h);
    // Define the points as {x, y}
    let start = { x: 0, y: 0 };
    let cp1 = { x: size * 1.1, y: 0 };
    let cp2 = { x: size, y: size * -0.1 };
    let end = { x: size, y: size };
    ctx.lineWidth = 4;
    ctx.strokeStyle = 'orange';
    // Cubic Bézier curve
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.bezierCurveTo(cp1.x, cp1.y, cp2.x, cp2.y, end.x, end.y);
    ctx.stroke();
    ctx.restore();
}
function drawLine(context, points, options = {}) {
    const { color = '#4630EB', lineWidth = 4 } = options;
    const [start, end] = points;
    context.beginPath();
    context.moveTo(start.x, start.y);
    context.lineTo(end.x, end.y);
    context.lineWidth = lineWidth;
    context.strokeStyle = color;
    context.stroke();
}
export function drawBarcodeBounds(context, { topLeftCorner, topRightCorner, bottomRightCorner, bottomLeftCorner }, options = {}) {
    // drawCorner(context, topLeftCorner.x, topLeftCorner.y, Math.PI * -0.5);
    // drawCorner(context, topRightCorner.x, topRightCorner.y, 0);
    // drawCorner(context, bottomLeftCorner.x, bottomLeftCorner.y, Math.PI);
    // drawCorner(context, bottomRightCorner.x, bottomRightCorner.y, Math.PI / 2);
    drawLine(context, [topLeftCorner, topRightCorner], options);
    drawLine(context, [topRightCorner, bottomRightCorner], options);
    drawLine(context, [bottomRightCorner, bottomLeftCorner], options);
    drawLine(context, [bottomLeftCorner, topLeftCorner], options);
}
//# sourceMappingURL=CameraUtils.js.map