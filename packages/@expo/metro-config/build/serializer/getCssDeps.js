"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getFileName = exports.fileNameFromContents = exports.getCssSerialAssets = exports.filterJsModules = void 0;
const js_1 = require("metro/src/DeltaBundler/Serializers/helpers/js");
const path_1 = __importDefault(require("path"));
const css_1 = require("../transform-worker/css");
const hash_1 = require("../utils/hash");
// s = static
const STATIC_EXPORT_DIRECTORY = '_expo/static/css';
function filterJsModules(dependencies, type, { processModuleFilter, projectRoot }) {
    const assets = [];
    for (const module of dependencies.values()) {
        if ((0, js_1.isJsModule)(module) &&
            processModuleFilter(module) &&
            (0, js_1.getJsOutput)(module).type === type &&
            path_1.default.relative(projectRoot, module.path) !== 'package.json') {
            assets.push(module);
        }
    }
    return assets;
}
exports.filterJsModules = filterJsModules;
function getCssSerialAssets(dependencies, { processModuleFilter, projectRoot }) {
    const assets = [];
    for (const module of filterJsModules(dependencies, 'js/module', {
        processModuleFilter,
        projectRoot,
    })) {
        const cssMetadata = getCssMetadata(module);
        if (cssMetadata) {
            const contents = cssMetadata.code;
            const originFilename = path_1.default.relative(projectRoot, module.path);
            const filename = path_1.default.join(
            // Consistent location
            STATIC_EXPORT_DIRECTORY, 
            // Hashed file contents + name for caching
            fileNameFromContents({
                // Stable filename for hashing in CI.
                filepath: originFilename,
                src: contents,
            }) + '.css');
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
    return assets;
}
exports.getCssSerialAssets = getCssSerialAssets;
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
function fileNameFromContents({ filepath, src }) {
    // Decode if the path is encoded from the Metro dev server, then normalize paths for Windows support.
    const decoded = decodeURIComponent(filepath).replace(/\\/g, '/');
    return getFileName(decoded) + '-' + (0, hash_1.hashString)(src);
}
exports.fileNameFromContents = fileNameFromContents;
function getFileName(module) {
    return path_1.default.basename(module).replace(/\.[^.]+$/, '');
}
exports.getFileName = getFileName;
//# sourceMappingURL=getCssDeps.js.map