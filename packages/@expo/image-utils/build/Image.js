"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.compositeImagesAsync = exports.generateFaviconAsync = exports.generateImageAsync = void 0;
const chalk_1 = __importDefault(require("chalk"));
const mime_1 = __importDefault(require("mime"));
const Cache = __importStar(require("./Cache"));
const Download = __importStar(require("./Download"));
const Ico = __importStar(require("./Ico"));
const env_1 = require("./env");
const Jimp = __importStar(require("./jimp"));
const Sharp = __importStar(require("./sharp"));
const supportedMimeTypes = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'];
let hasWarned = false;
async function resizeImagesAsync(buffer, sizes) {
    const sharp = await getSharpAsync();
    if (!sharp) {
        return Jimp.resizeBufferAsync(buffer, sizes);
    }
    return Sharp.resizeBufferAsync(buffer, sizes);
}
async function resizeAsync(imageOptions) {
    const sharp = await getSharpAsync();
    const { width, height, backgroundColor, resizeMode } = imageOptions;
    if (!sharp) {
        const inputOptions = { input: imageOptions.src, quality: 100 };
        const jimp = await Jimp.resize(inputOptions, {
            width,
            height,
            fit: resizeMode,
            background: backgroundColor,
        });
        if (imageOptions.removeTransparency) {
            jimp.colorType(2);
        }
        if (imageOptions.borderRadius) {
            // TODO: support setting border radius with Jimp. Currently only support making the image a circle
            await Jimp.circleAsync(jimp);
        }
        // Convert to png buffer
        return jimp.getBufferAsync('image/png');
    }
    try {
        let sharpBuffer = sharp(imageOptions.src)
            .ensureAlpha()
            .resize(width, height, { fit: resizeMode, background: 'transparent' });
        // Skip an extra step if the background is explicitly transparent.
        if (backgroundColor && backgroundColor !== 'transparent') {
            // Add the background color to the image
            sharpBuffer = sharpBuffer.composite([
                {
                    // create a background color
                    input: {
                        create: {
                            width,
                            height,
                            // allow alpha colors
                            channels: imageOptions.removeTransparency ? 3 : 4,
                            background: backgroundColor,
                        },
                    },
                    // dest-over makes the first image (input) appear on top of the created image (background color)
                    blend: 'dest-over',
                },
            ]);
        }
        else if (imageOptions.removeTransparency) {
            sharpBuffer.flatten();
        }
        if (imageOptions.borderRadius) {
            const mask = Buffer.from(`<svg><rect x="0" y="0" width="${width}" height="${height}"
        rx="${imageOptions.borderRadius}" ry="${imageOptions.borderRadius}"
        fill="${backgroundColor && backgroundColor !== 'transparent' ? backgroundColor : 'none'}" /></svg>`);
            sharpBuffer.composite([{ input: mask, blend: 'dest-in' }]);
        }
        return await sharpBuffer.png().toBuffer();
    }
    catch ({ message }) {
        throw new Error(`It was not possible to generate splash screen '${imageOptions.src}'. ${message}`);
    }
}
async function getSharpAsync() {
    let sharp;
    if (await Sharp.isAvailableAsync())
        sharp = await Sharp.findSharpInstanceAsync();
    return sharp;
}
function getDimensionsId(imageOptions) {
    return imageOptions.width === imageOptions.height
        ? `${imageOptions.width}`
        : `${imageOptions.width}x${imageOptions.height}`;
}
async function maybeWarnAboutInstallingSharpAsync() {
    // Putting the warning here will prevent the warning from showing if all images were reused from the cache
    if (env_1.env.EXPO_IMAGE_UTILS_DEBUG && !hasWarned && !(await Sharp.isAvailableAsync())) {
        hasWarned = true;
        console.warn(chalk_1.default.yellow(`Using node to generate images. This is much slower than using native packages.\n\u203A Optionally you can stop the process and try again after successfully running \`npm install -g sharp-cli\`.\n`));
    }
}
async function ensureImageOptionsAsync(imageOptions) {
    const icon = {
        ...imageOptions,
        src: await Download.downloadOrUseCachedImage(imageOptions.src),
    };
    // Default to contain
    if (!icon.resizeMode) {
        icon.resizeMode = 'contain';
    }
    const mimeType = mime_1.default.getType(icon.src);
    if (!mimeType) {
        throw new Error(`Invalid mimeType for image with source: ${icon.src}`);
    }
    if (!supportedMimeTypes.includes(mimeType)) {
        throw new Error(`Supplied image is not a supported image type: ${imageOptions.src}`);
    }
    if (!icon.name) {
        icon.name = `icon_${getDimensionsId(imageOptions)}.${mime_1.default.getExtension(mimeType)}`;
    }
    return icon;
}
async function generateImageAsync(options, imageOptions) {
    const icon = await ensureImageOptionsAsync(imageOptions);
    if (!options.cacheType) {
        await maybeWarnAboutInstallingSharpAsync();
        return { name: icon.name, source: await resizeAsync(icon) };
    }
    const cacheKey = await Cache.createCacheKeyWithDirectoryAsync(options.projectRoot, options.cacheType, icon);
    const name = icon.name;
    let source = await Cache.getImageFromCacheAsync(name, cacheKey);
    if (!source) {
        await maybeWarnAboutInstallingSharpAsync();
        source = await resizeAsync(icon);
        await Cache.cacheImageAsync(name, source, cacheKey);
    }
    return { name, source };
}
exports.generateImageAsync = generateImageAsync;
async function generateFaviconAsync(pngImageBuffer, sizes = [16, 32, 48]) {
    const buffers = await resizeImagesAsync(pngImageBuffer, sizes);
    return await Ico.generateAsync(buffers);
}
exports.generateFaviconAsync = generateFaviconAsync;
/**
 * Layers the provided foreground image over the provided background image.
 *
 * @param foregroundImageBuffer
 * @param foregroundImageBuffer
 * @param x pixel offset from the left edge, defaults to 0.
 * @param y pixel offset from the top edge, defaults to 0.
 */
async function compositeImagesAsync({ foreground, background, x = 0, y = 0, }) {
    const sharp = await getSharpAsync();
    if (!sharp) {
        const image = (await Jimp.getJimpImageAsync(background)).composite(await Jimp.getJimpImageAsync(foreground), x, y);
        return await image.getBufferAsync(image.getMIME());
    }
    return await sharp(background)
        .composite([{ input: foreground, left: x, top: y }])
        .toBuffer();
}
exports.compositeImagesAsync = compositeImagesAsync;
//# sourceMappingURL=Image.js.map