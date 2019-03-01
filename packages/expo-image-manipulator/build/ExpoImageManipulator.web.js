import { CodedError } from 'expo-errors';
import { FlipType, } from './ImageManipulator.types';
/**
 * Hermite resize - fast image resize/resample using Hermite filter. 1 cpu version!
 * https://stackoverflow.com/a/18320662/4047926
 *
 * @param {HtmlElement} canvas
 * @param {int} width
 * @param {int} height
 * @param {boolean} resize_canvas if true, canvas will be resized. Optional.
 */
function resampleSingle(canvas, width, height, resize_canvas = false) {
    var width_source = canvas.width;
    var height_source = canvas.height;
    width = Math.round(width);
    height = Math.round(height);
    var ratio_w = width_source / width;
    var ratio_h = height_source / height;
    var ratio_w_half = Math.ceil(ratio_w / 2);
    var ratio_h_half = Math.ceil(ratio_h / 2);
    let ctx = getContext(canvas);
    var img = ctx.getImageData(0, 0, width_source, height_source);
    var img2 = ctx.createImageData(width, height);
    var data = img.data;
    var data2 = img2.data;
    for (var j = 0; j < height; j++) {
        for (var i = 0; i < width; i++) {
            var x2 = (i + j * width) * 4;
            var weight = 0;
            var weights = 0;
            var weights_alpha = 0;
            var gx_r = 0;
            var gx_g = 0;
            var gx_b = 0;
            var gx_a = 0;
            var center_y = (j + 0.5) * ratio_h;
            var yy_start = Math.floor(j * ratio_h);
            var yy_stop = Math.ceil((j + 1) * ratio_h);
            for (var yy = yy_start; yy < yy_stop; yy++) {
                var dy = Math.abs(center_y - (yy + 0.5)) / ratio_h_half;
                var center_x = (i + 0.5) * ratio_w;
                var w0 = dy * dy; //pre-calc part of w
                var xx_start = Math.floor(i * ratio_w);
                var xx_stop = Math.ceil((i + 1) * ratio_w);
                for (var xx = xx_start; xx < xx_stop; xx++) {
                    var dx = Math.abs(center_x - (xx + 0.5)) / ratio_w_half;
                    var w = Math.sqrt(w0 + dx * dx);
                    if (w >= 1) {
                        //pixel too far
                        continue;
                    }
                    //hermite filter
                    weight = 2 * w * w * w - 3 * w * w + 1;
                    var pos_x = 4 * (xx + yy * width_source);
                    //alpha
                    gx_a += weight * data[pos_x + 3];
                    weights_alpha += weight;
                    //colors
                    if (data[pos_x + 3] < 255)
                        weight = (weight * data[pos_x + 3]) / 250;
                    gx_r += weight * data[pos_x];
                    gx_g += weight * data[pos_x + 1];
                    gx_b += weight * data[pos_x + 2];
                    weights += weight;
                }
            }
            data2[x2] = gx_r / weights;
            data2[x2 + 1] = gx_g / weights;
            data2[x2 + 2] = gx_b / weights;
            data2[x2 + 3] = gx_a / weights_alpha;
        }
    }
    //clear and resize canvas
    if (resize_canvas) {
        canvas.width = width;
        canvas.height = height;
    }
    else {
        ctx.clearRect(0, 0, width_source, height_source);
    }
    //draw
    ctx.putImageData(img2, 0, 0);
}
function sizeFromAngle(w, h, a) {
    const rads = (a * Math.PI) / 180;
    let c = Math.cos(rads);
    let s = Math.sin(rads);
    if (s < 0) {
        s = -s;
    }
    if (c < 0) {
        c = -c;
    }
    return { width: h * s + w * c, height: h * c + w * s };
}
function cropImage(canvas, img, x = 0, y = 0, w = 0, h = 0) {
    const context = getContext(canvas);
    context.save();
    context.drawImage(img, x, y, // Start at 70/20 pixels from the left and the top of the image (crop),
    w, h, // "Get" a `50 * 50` (w * h) area from the source image (crop),
    0, 0, // Place the result at 0, 0 in the canvas,
    w, h); // With as width / height: 100 * 100 (scale)
}
function drawImage(canvas, img, x = 0, y = 0, deg = 0, xFlip = false, yFlip = false, center = false, width, height) {
    const context = getContext(canvas);
    context.save();
    if (width == null) {
        width = img.naturalWidth;
    }
    if (height == null) {
        height = img.naturalHeight;
    }
    // Set rotation point to center of image, instead of top/left
    // if (center) {
    //   x -= width / 2;
    //   y -= height / 2;
    // }
    // Set the origin to the center of the image
    context.translate(x + canvas.width / 2, y + canvas.height / 2);
    // Rotate the canvas around the origin
    var rad = 2 * Math.PI - (deg * Math.PI) / 180;
    context.rotate(rad);
    // Flip/flop the canvas
    let xScale = xFlip ? -1 : 1;
    let yScale = yFlip ? -1 : 1;
    context.scale(xScale, yScale);
    // Draw the image
    context.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2, img.naturalWidth, img.naturalHeight);
    context.restore();
    return context;
}
function getContext(canvas) {
    const ctx = canvas.getContext('2d');
    if (!ctx) {
        throw new CodedError('ERR_IMAGE_MANIPULATOR', 'Failed to create canvas context');
    }
    return ctx;
}
function getResults(canvas, options) {
    let base64;
    if (options) {
        const { format = 'png' } = options;
        if (options.format === 'png' && options.compress !== undefined) {
            console.warn('compress is not supported with png format.');
        }
        const quality = Math.min(1, Math.max(0, options.compress || 1));
        base64 = canvas.toDataURL('image/' + format, quality);
    }
    else {
        // defaults to PNG with no loss
        base64 = canvas.toDataURL();
    }
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
        imageSource.onload = () => resolve(imageSource);
        imageSource.onerror = () => reject(imageSource);
        imageSource.src = uri;
    });
}
async function manipulateWithActionAsync(uri, action, options) {
    let canvas = document.createElement('canvas');
    const imageSource = await loadImageAsync(uri);
    canvas.width = imageSource.naturalWidth;
    canvas.height = imageSource.naturalHeight;
    if (action.crop) {
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
        width = Math.min(originX + width, canvas.width);
        height = Math.min(originY + height, canvas.height);
        if (originX - width === 0 || originY - height === 0) {
            throw new CodedError('ERR_IMAGE_MANIPULATOR_CROP', 'Crop size must be greater than 0: ' + JSON.stringify(crop, null, 2));
        }
        // change size of canvas.
        canvas.width = width;
        canvas.height = height;
        cropImage(canvas, imageSource, originX, originY, width, height);
    }
    else if (action.resize) {
        const { resize } = action;
        const { width, height } = resize;
        const imageRatio = imageSource.naturalWidth / imageSource.naturalHeight;
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
        const context = getContext(canvas);
        context.save();
        context.drawImage(imageSource, 0, 0, imageSource.naturalWidth, imageSource.naturalHeight);
        resampleSingle(canvas, requestedWidth, requestedHeight);
    }
    else if (action.flip !== undefined) {
        const { flip } = action;
        const xFlip = flip === FlipType.Horizontal;
        const yFlip = flip === FlipType.Vertical;
        drawImage(canvas, imageSource, 0, 0, 0, xFlip, yFlip);
    }
    else if (action.rotate !== undefined) {
        const { rotate } = action;
        const { width, height } = sizeFromAngle(imageSource.naturalWidth, imageSource.naturalHeight, rotate);
        canvas.width = width;
        canvas.height = height;
        drawImage(canvas, imageSource, 0, 0, rotate, false, false, false, width, height);
    }
    else {
        const context = getContext(canvas);
        context.save();
        context.drawImage(imageSource, 0, 0, imageSource.naturalWidth, imageSource.naturalHeight);
    }
    return getResults(canvas, options);
}
export default {
    get name() {
        return 'ExpoImageManipulator';
    },
    async manipulateAsync(uri, actions = [], options) {
        if (!actions.length) {
            let canvas = document.createElement('canvas');
            const imageSource = await loadImageAsync(uri);
            canvas.width = imageSource.naturalWidth;
            canvas.height = imageSource.naturalHeight;
            const ctx = getContext(canvas);
            ctx.drawImage(imageSource, 0, 0, imageSource.naturalWidth, imageSource.naturalHeight);
            return getResults(canvas, options);
        }
        else {
            let output;
            // console.dir(imageSource, canvas, ctx);
            for (let i = 0; i < actions.length; i++) {
                const action = actions[i];
                let _options;
                if (i === actions.length - 1) {
                    _options = options;
                }
                output = await manipulateWithActionAsync(uri || output.uri, action, _options);
            }
            return output;
        }
    },
};
//# sourceMappingURL=ExpoImageManipulator.web.js.map