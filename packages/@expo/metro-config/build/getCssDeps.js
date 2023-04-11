"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCssModules = void 0;
const crypto_1 = __importDefault(require("crypto"));
const js_1 = require("metro/src/DeltaBundler/Serializers/helpers/js");
const path_1 = __importDefault(require("path"));
const css_1 = require("./transform-worker/css");
function getCssModules(dependencies, { processModuleFilter, projectRoot }) {
    const assets = [];
    for (const module of dependencies.values()) {
        if ((0, js_1.isJsModule)(module) &&
            processModuleFilter(module) &&
            (0, js_1.getJsOutput)(module).type === 'js/module' &&
            path_1.default.relative(projectRoot, module.path) !== 'package.json') {
            const cssMetadata = getCssMetadata(module);
            if (cssMetadata) {
                const contents = cssMetadata.code;
                const filename = path_1.default.join(
                // Consistent location
                STATIC_EXPORT_DIRECTORY, 
                // Hashed file contents + name for caching
                getFileName(module.path) + '-' + hashString(module.path + contents) + '.css');
                const originFilename = path_1.default.relative(projectRoot, module.path);
                assets.push({
                    type: 'css',
                    originFilename,
                    filename,
                    source: contents,
                    metadata: {
                        hmrId: (0, css_1.pathToHtmlSafeName)(originFilename),
                    },
                });
            }
        }
    }
    return assets;
}
exports.getCssModules = getCssModules;
function getCssMetadata(module) {
    const data = module.output[0]?.data;
    if (data && typeof data === 'object' && 'css' in data) {
        if (typeof data.css !== 'object' || !('code' in data.css)) {
            throw new Error(`Unexpected CSS metadata in Metro module (${module.path}): ${JSON.stringify(data.css)}`);
        }
        return data.css;
    }
    return null;
}
// s = static
const STATIC_EXPORT_DIRECTORY = '_expo/static/css';
function getFileName(module) {
    return path_1.default.basename(module).replace(/\.[^.]+$/, '');
}
function hashString(str) {
    return crypto_1.default.createHash('md5').update(str).digest('hex');
}
