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
Object.defineProperty(exports, "__esModule", { value: true });
exports.compositeImagesAsync = exports.Cache = exports.generateFaviconAsync = exports.generateImageAsync = exports.sharpAsync = exports.isAvailableAsync = exports.findSharpInstanceAsync = exports.jimpAsync = exports.imageAsync = void 0;
const Cache = __importStar(require("./Cache"));
exports.Cache = Cache;
const Image_1 = require("./Image");
Object.defineProperty(exports, "compositeImagesAsync", { enumerable: true, get: function () { return Image_1.compositeImagesAsync; } });
Object.defineProperty(exports, "generateFaviconAsync", { enumerable: true, get: function () { return Image_1.generateFaviconAsync; } });
Object.defineProperty(exports, "generateImageAsync", { enumerable: true, get: function () { return Image_1.generateImageAsync; } });
const jimp_1 = require("./jimp");
Object.defineProperty(exports, "jimpAsync", { enumerable: true, get: function () { return jimp_1.jimpAsync; } });
const sharp_1 = require("./sharp");
Object.defineProperty(exports, "findSharpInstanceAsync", { enumerable: true, get: function () { return sharp_1.findSharpInstanceAsync; } });
Object.defineProperty(exports, "isAvailableAsync", { enumerable: true, get: function () { return sharp_1.isAvailableAsync; } });
Object.defineProperty(exports, "sharpAsync", { enumerable: true, get: function () { return sharp_1.sharpAsync; } });
async function imageAsync(options, commands = []) {
    if (await (0, sharp_1.isAvailableAsync)()) {
        return (0, sharp_1.sharpAsync)(options, commands);
    }
    return (0, jimp_1.jimpAsync)({ ...options, format: (0, jimp_1.convertFormat)(options.format), originalInput: options.input }, commands);
}
exports.imageAsync = imageAsync;
//# sourceMappingURL=index.js.map