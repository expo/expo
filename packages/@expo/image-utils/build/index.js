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
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPngInfo = exports.compositeImagesAsync = exports.Cache = exports.generateFaviconAsync = exports.generateImageBackgroundAsync = exports.generateImageAsync = exports.sharpAsync = exports.isAvailableAsync = exports.findSharpInstanceAsync = exports.createSquareAsync = exports.jimpAsync = void 0;
exports.imageAsync = imageAsync;
const Cache = __importStar(require("./Cache"));
exports.Cache = Cache;
const Image_1 = require("./Image");
Object.defineProperty(exports, "compositeImagesAsync", { enumerable: true, get: function () { return Image_1.compositeImagesAsync; } });
Object.defineProperty(exports, "generateFaviconAsync", { enumerable: true, get: function () { return Image_1.generateFaviconAsync; } });
Object.defineProperty(exports, "generateImageAsync", { enumerable: true, get: function () { return Image_1.generateImageAsync; } });
Object.defineProperty(exports, "generateImageBackgroundAsync", { enumerable: true, get: function () { return Image_1.generateImageBackgroundAsync; } });
Object.defineProperty(exports, "getPngInfo", { enumerable: true, get: function () { return Image_1.getPngInfo; } });
const jimp_1 = require("./jimp");
Object.defineProperty(exports, "jimpAsync", { enumerable: true, get: function () { return jimp_1.jimpAsync; } });
Object.defineProperty(exports, "createSquareAsync", { enumerable: true, get: function () { return jimp_1.createSquareAsync; } });
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
//# sourceMappingURL=index.js.map