import { CodedError } from '@unimodules/core';
import { FlipType, SaveFormat, } from './ImageManipulator.types';
/**
 * Hermite resize - fast image resize/resample using Hermite filter. 1 cpu version!
 * https://stackoverflow.com/a/18320662/4047926
 *
 * @param {HTMLCanvasElement} canvas
 * @param {int} width
 * @param {int} height
 * @param {boolean} resizeCanvas if true, canvas will be resized. Optional.
 */
function resampleSingle(canvas, width, height, resizeCanvas = false) {
    const result = document.createElement('canvas');
    result.width = canvas.width;
    result.height = canvas.height;
    const widthSource = canvas.width;
    const heightSource = canvas.height;
    width = Math.round(width);
    height = Math.round(height);
    const wRatio = widthSource / width;
    const hRatio = heightSource / height;
    const wRatioHalf = Math.ceil(wRatio / 2);
    const hRatioHalf = Math.ceil(hRatio / 2);
    const ctx = getContext(canvas);
    const img = ctx.getImageData(0, 0, widthSource, heightSource);
    const img2 = ctx.createImageData(width, height);
    const data = img.data;
    const data2 = img2.data;
    for (let j = 0; j < height; j++) {
        for (let i = 0; i < width; i++) {
            const x2 = (i + j * width) * 4;
            let weight = 0;
            let weights = 0;
            let weightsAlpha = 0;
            let gx_r = 0;
            let gx_g = 0;
            let gx_b = 0;
            let gx_a = 0;
            const yCenter = (j + 0.5) * hRatio;
            const yy_start = Math.floor(j * hRatio);
            const yy_stop = Math.ceil((j + 1) * hRatio);
            for (let yy = yy_start; yy < yy_stop; yy++) {
                const dy = Math.abs(yCenter - (yy + 0.5)) / hRatioHalf;
                const center_x = (i + 0.5) * wRatio;
                const w0 = dy * dy; //pre-calc part of w
                const xx_start = Math.floor(i * wRatio);
                const xx_stop = Math.ceil((i + 1) * wRatio);
                for (let xx = xx_start; xx < xx_stop; xx++) {
                    const dx = Math.abs(center_x - (xx + 0.5)) / wRatioHalf;
                    const w = Math.sqrt(w0 + dx * dx);
                    if (w >= 1) {
                        //pixel too far
                        continue;
                    }
                    //hermite filter
                    weight = 2 * w * w * w - 3 * w * w + 1;
                    const xPosition = 4 * (xx + yy * widthSource);
                    //alpha
                    gx_a += weight * data[xPosition + 3];
                    weightsAlpha += weight;
                    //colors
                    if (data[xPosition + 3] < 255) {
                        weight = (weight * data[xPosition + 3]) / 250;
                    }
                    gx_r += weight * data[xPosition];
                    gx_g += weight * data[xPosition + 1];
                    gx_b += weight * data[xPosition + 2];
                    weights += weight;
                }
            }
            data2[x2] = gx_r / weights;
            data2[x2 + 1] = gx_g / weights;
            data2[x2 + 2] = gx_b / weights;
            data2[x2 + 3] = gx_a / weightsAlpha;
        }
    }
    //resize canvas
    if (resizeCanvas) {
        result.width = width;
        result.height = height;
    }
    //draw
    const context = getContext(result);
    context.putImageData(img2, 0, 0);
    return result;
}
function sizeFromAngle(width, height, angle) {
    const radians = (angle * Math.PI) / 180;
    let c = Math.cos(radians);
    let s = Math.sin(radians);
    if (s < 0) {
        s = -s;
    }
    if (c < 0) {
        c = -c;
    }
    return { width: height * s + width * c, height: height * c + width * s };
}
function cropImage(image, x = 0, y = 0, width = 0, height = 0) {
    const result = document.createElement('canvas');
    result.width = width;
    result.height = height;
    const context = getContext(result);
    context.drawImage(image, x, y, width, height, 0, 0, width, height);
    return result;
}
function drawImage(img, x = 0, y = 0, angle = 0, xFlip = false, yFlip = false, width, height) {
    const result = document.createElement('canvas');
    result.width = width ?? img.width;
    result.height = height ?? img.height;
    const context = getContext(result);
    // Set the origin to the center of the image
    context.translate(x + result.width / 2, y + result.height / 2);
    // Rotate the canvas around the origin
    const radians = (angle * Math.PI) / 180;
    context.rotate(radians);
    // Flip/flop the canvas
    const xScale = xFlip ? -1 : 1;
    const yScale = yFlip ? -1 : 1;
    context.scale(xScale, yScale);
    // Draw the image
    context.drawImage(img, -img.width / 2, -img.height / 2, img.width, img.height);
    return result;
}
function getContext(canvas) {
    const ctx = canvas.getContext('2d');
    if (!ctx) {
        throw new CodedError('ERR_IMAGE_MANIPULATOR', 'Failed to create canvas context');
    }
    return ctx;
}
function getResults(canvas, options) {
    const { format = SaveFormat.JPEG, compress = 1 } = options;
    const quality = Math.min(1, Math.max(0, compress));
    const base64 = canvas.toDataURL('image/' + format, quality);
    return {
        uri: base64,
        width: canvas.width,
        height: canvas.height,
        base64,
    };
}
function loadImageAsync(uri) {
    return new Promise((resolve, reject) => {
        const imageSource = new Image();
        const canvas = document.createElement('canvas');
        imageSource.onload = () => {
            canvas.width = imageSource.naturalWidth;
            canvas.height = imageSource.naturalHeight;
            const context = getContext(canvas);
            context.drawImage(imageSource, 0, 0, imageSource.naturalWidth, imageSource.naturalHeight);
            resolve(canvas);
        };
        imageSource.onerror = () => reject(canvas);
        imageSource.src = uri;
    });
}
function actionCrop(canvas, action) {
    const { crop } = action;
    // ensure values are defined.
    let { originX = 0, originY = 0, width = 0, height = 0 } = crop;
    const clamp = (value, max) => Math.max(0, Math.min(max, value));
    // lock within bounds.
    width = clamp(width, canvas.width);
    height = clamp(height, canvas.height);
    originX = clamp(originX, canvas.width);
    originY = clamp(originY, canvas.height);
    // lock sum of crop.
    width = Math.min(originX + width, canvas.width) - originX;
    height = Math.min(originY + height, canvas.height) - originY;
    if (width === 0 || height === 0) {
        throw new CodedError('ERR_IMAGE_MANIPULATOR_CROP', 'Crop size must be greater than 0: ' + JSON.stringify(crop, null, 2));
    }
    return cropImage(canvas, originX, originY, width, height);
}
function actionFill(canvas, action) {
    const { fill } = action;
    const result = document.createElement('canvas');
    result.width = canvas.width;
    result.height = canvas.height;
    const context = getContext(result);
    context.fillStyle = fill;
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(canvas, 0, 0, canvas.width, canvas.height);
    return result;
}
function actionResize(canvas, action) {
    const { resize: { width, height }, } = action;
    const imageRatio = canvas.width / canvas.height;
    let requestedWidth = 0;
    let requestedHeight = 0;
    if (width !== undefined) {
        requestedWidth = width;
        requestedHeight = requestedWidth / imageRatio;
    }
    if (height !== undefined) {
        requestedHeight = height;
        if (requestedWidth === 0) {
            requestedWidth = requestedHeight * imageRatio;
        }
    }
    return resampleSingle(canvas, requestedWidth, requestedHeight, true);
}
function actionFlip(canvas, action) {
    const { flip } = action;
    const xFlip = flip === FlipType.Horizontal;
    const yFlip = flip === FlipType.Vertical;
    return drawImage(canvas, 0, 0, 0, xFlip, yFlip);
}
function actionRotate(canvas, action) {
    const { rotate } = action;
    const { width, height } = sizeFromAngle(canvas.width, canvas.height, rotate);
    return drawImage(canvas, 0, 0, rotate, false, false, width, height);
}
export default {
    get name() {
        return 'ExpoImageManipulator';
    },
    async manipulateAsync(uri, actions = [], options) {
        const original = await loadImageAsync(uri);
        const result = actions.reduce((canvas, action) => {
            if (action.crop) {
                return actionCrop(canvas, action);
            }
            else if (action.fill !== undefined) {
                return actionFill(canvas, action);
            }
            else if (action.resize) {
                return actionResize(canvas, action);
            }
            else if (action.flip !== undefined) {
                return actionFlip(canvas, action);
            }
            else if (action.rotate !== undefined) {
                return actionRotate(canvas, action);
            }
            else {
                return canvas;
            }
        }, original);
        return getResults(result, options);
    },
};
//# sourceMappingURL=ExpoImageManipulator.web.js.map