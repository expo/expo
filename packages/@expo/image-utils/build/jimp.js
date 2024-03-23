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
exports.resize = exports.getJimpImageAsync = exports.createSquareAsync = exports.circleAsync = exports.isFolderAsync = exports.jimpAsync = exports.convertFormat = exports.resizeBufferAsync = void 0;
const fs_extra_1 = __importDefault(require("fs-extra"));
// @ts-ignore
const jimp_compact_1 = __importDefault(require("jimp-compact"));
const path = __importStar(require("path"));
async function resizeBufferAsync(buffer, sizes) {
    return Promise.all(sizes.map(async (size) => {
        // Parse the buffer each time to prevent mutable copies.
        // Parse the buffer each time to prevent mutable copies.
        const jimpImage = await jimp_compact_1.default.read(buffer);
        const mime = jimpImage.getMIME();
        return jimpImage.resize(size, size).getBufferAsync(mime);
    }));
}
exports.resizeBufferAsync = resizeBufferAsync;
function convertFormat(format) {
    if (typeof format === 'undefined')
        return format;
    const input = format?.toLowerCase();
    switch (input) {
        case 'png':
        case 'webp':
        case 'jpeg':
            return `image/${input}`;
        case 'jpg':
            return `image/jpeg`;
    }
    return undefined;
}
exports.convertFormat = convertFormat;
async function jimpAsync(options, commands = []) {
    if (commands.length) {
        const command = commands.shift();
        if (command) {
            let input;
            if (command.operation === 'resize') {
                input = await resize(options, command);
            }
            else if (command.operation === 'flatten') {
                input = await flatten(options, command);
            }
            else {
                throw new Error(`The operation: '${command.operation}' is not supported with Jimp`);
            }
            // @ts-ignore
            return jimpAsync({ ...options, input }, commands);
        }
    }
    const image = await getJimpImageAsync(options.input);
    const mime = typeof options.format === 'string' ? options.format : image.getMIME();
    const imgBuffer = await image.getBufferAsync(mime);
    if (typeof options.output === 'string') {
        if (await isFolderAsync(options.output)) {
            await fs_extra_1.default.writeFile(path.join(options.output, path.basename(options.originalInput)), imgBuffer);
        }
        else {
            await fs_extra_1.default.writeFile(options.output, imgBuffer);
        }
    }
    return imgBuffer;
}
exports.jimpAsync = jimpAsync;
async function isFolderAsync(path) {
    try {
        return (await fs_extra_1.default.stat(path)).isDirectory();
    }
    catch {
        return false;
    }
}
exports.isFolderAsync = isFolderAsync;
function circleAsync(jimp) {
    const radius = Math.min(jimp.bitmap.width, jimp.bitmap.height) / 2;
    const center = {
        x: jimp.bitmap.width / 2,
        y: jimp.bitmap.height / 2,
    };
    return new Promise((resolve) => {
        jimp.scanQuiet(0, 0, jimp.bitmap.width, jimp.bitmap.height, (x, y, idx) => {
            const curR = Math.sqrt(Math.pow(x - center.x, 2) + Math.pow(y - center.y, 2));
            if (radius - curR <= 0.0) {
                jimp.bitmap.data[idx + 3] = 0;
            }
            else if (radius - curR < 1.0) {
                jimp.bitmap.data[idx + 3] = 255 * (radius - curR);
            }
            resolve(jimp);
        });
    });
}
exports.circleAsync = circleAsync;
/**
 * Create a square image of a given size and color. Defaults to a white PNG.
 */
async function createSquareAsync({ size, color = '#FFFFFF', mime = jimp_compact_1.default.MIME_PNG, }) {
    const image = await new jimp_compact_1.default(size, size, color);
    // Convert Jimp image to a Buffer
    return await image.getBufferAsync(mime);
}
exports.createSquareAsync = createSquareAsync;
async function getJimpImageAsync(input) {
    // @ts-ignore: Jimp types are broken
    if (typeof input === 'string' || input instanceof Buffer)
        return await jimp_compact_1.default.read(input);
    return input;
}
exports.getJimpImageAsync = getJimpImageAsync;
async function resize({ input, quality = 100 }, { background, position, fit, width, height }) {
    let initialImage = await getJimpImageAsync(input);
    if (width && !height) {
        height = jimp_compact_1.default.AUTO;
    }
    else if (!width && height) {
        width = jimp_compact_1.default.AUTO;
    }
    else if (!width && !height) {
        width = initialImage.bitmap.width;
        height = initialImage.bitmap.height;
    }
    const jimpPosition = convertPosition(position);
    const jimpQuality = typeof quality !== 'number' ? 100 : quality;
    if (fit === 'cover') {
        initialImage = initialImage.cover(width, height, jimpPosition);
    }
    else if (fit === 'contain') {
        initialImage = initialImage.contain(width, height, jimpPosition);
    }
    else {
        throw new Error(`Unsupported fit: ${fit}. Please choose either 'cover', or 'contain' when using Jimp`);
    }
    if (background) {
        initialImage = initialImage.composite(new jimp_compact_1.default(width, height, background), 0, 0, {
            mode: jimp_compact_1.default.BLEND_DESTINATION_OVER,
            opacitySource: 1,
            opacityDest: 1,
        });
    }
    return await initialImage.quality(jimpQuality);
}
exports.resize = resize;
async function flatten({ input, quality = 100 }, { background }) {
    const initialImage = await getJimpImageAsync(input);
    const jimpQuality = typeof quality !== 'number' ? 100 : quality;
    return initialImage.quality(jimpQuality).background(jimp_compact_1.default.cssColorToHex(background));
}
/**
 * Convert sharp position to Jimp position.
 *
 * @param position
 */
function convertPosition(position) {
    if (!position)
        return convertPosition('center');
    switch (position) {
        case 'center':
        case 'centre':
            return jimp_compact_1.default.VERTICAL_ALIGN_MIDDLE | jimp_compact_1.default.HORIZONTAL_ALIGN_CENTER;
        case 'north':
        case 'top':
            return jimp_compact_1.default.VERTICAL_ALIGN_TOP | jimp_compact_1.default.HORIZONTAL_ALIGN_CENTER;
        case 'east':
        case 'right':
            return jimp_compact_1.default.VERTICAL_ALIGN_MIDDLE | jimp_compact_1.default.HORIZONTAL_ALIGN_RIGHT;
        case 'south':
        case 'bottom':
            return jimp_compact_1.default.VERTICAL_ALIGN_BOTTOM | jimp_compact_1.default.HORIZONTAL_ALIGN_CENTER;
        case 'west':
        case 'left':
            return jimp_compact_1.default.VERTICAL_ALIGN_MIDDLE | jimp_compact_1.default.HORIZONTAL_ALIGN_LEFT;
        case 'northeast':
        case 'right top':
            return jimp_compact_1.default.VERTICAL_ALIGN_TOP | jimp_compact_1.default.HORIZONTAL_ALIGN_RIGHT;
        case 'southeast':
        case 'right bottom':
            return jimp_compact_1.default.VERTICAL_ALIGN_BOTTOM | jimp_compact_1.default.HORIZONTAL_ALIGN_RIGHT;
        case 'southwest':
        case 'left bottom':
            return jimp_compact_1.default.VERTICAL_ALIGN_BOTTOM | jimp_compact_1.default.HORIZONTAL_ALIGN_LEFT;
        case 'northwest':
        case 'left top':
            return jimp_compact_1.default.VERTICAL_ALIGN_TOP | jimp_compact_1.default.HORIZONTAL_ALIGN_LEFT;
        case 'entropy':
        case 'attention':
            throw new Error(`Position: '${position}' is not supported`);
        default:
            throw new Error(`Unknown position: '${position}'`);
    }
}
//# sourceMappingURL=jimp.js.map