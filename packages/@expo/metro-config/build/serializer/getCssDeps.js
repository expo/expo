"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCssSerialAssets = getCssSerialAssets;
exports.fileNameFromContents = fileNameFromContents;
exports.getFileName = getFileName;
// NOTE(@kitten): jest-resolver -> resolve.exports bug (https://github.com/lukeed/resolve.exports/issues/40)
const js_js_1 = require("@expo/metro/metro/DeltaBundler/Serializers/helpers/js.js");
const isResolvedDependency_1 = require("@expo/metro/metro/lib/isResolvedDependency");
const path_1 = __importDefault(require("path"));
const css_1 = require("../transform-worker/css");
const filePath_1 = require("../utils/filePath");
const hash_1 = require("../utils/hash");
// s = static
const STATIC_EXPORT_DIRECTORY = '_expo/static/css';
function isTypeJSModule(module) {
    return (0, js_js_1.isJsModule)(module);
}
function getCssSerialAssets(dependencies, { projectRoot, entryFile }) {
    const assets = [];
    const visited = new Set();
    function pushCssModule(module) {
        const cssMetadata = getCssMetadata(module);
        if (cssMetadata) {
            const contents = cssMetadata.code;
            // NOTE(cedric): these relative paths are used as URL pathnames when serializing HTML
            // Use POSIX-format to avoid urls like `_expo/static/css/some\\file\\name.css`
            const originFilename = (0, filePath_1.toPosixPath)(path_1.default.relative(projectRoot, module.path));
            const filename = (0, filePath_1.toPosixPath)(path_1.default.join(
            // Consistent location
            STATIC_EXPORT_DIRECTORY, 
            // Hashed file contents + name for caching
            fileNameFromContents({
                // Stable filename for hashing in CI.
                filepath: originFilename,
                src: contents,
            }) + '.css'));
            if (cssMetadata.externalImports) {
                for (const external of cssMetadata.externalImports) {
                    let source = `<link rel="stylesheet" href="${external.url}"`;
                    // TODO: How can we do this for local css imports?
                    if (external.media) {
                        source += `media="${external.media}"`;
                    }
                    // TODO: supports attribute
                    source += '>';
                    assets.push({
                        type: 'css-external',
                        originFilename,
                        filename: external.url,
                        // Link CSS file
                        source,
                        metadata: {
                            hmrId: (0, css_1.pathToHtmlSafeName)(originFilename),
                        },
                    });
                }
            }
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
    function checkDep(absolutePath) {
        if (visited.has(absolutePath)) {
            return;
        }
        visited.add(absolutePath);
        const next = dependencies.get(absolutePath);
        if (!next) {
            return;
        }
        next.dependencies.forEach((dep) => {
            // Traverse the deps next to ensure the CSS is pushed in the correct order.
            if ((0, isResolvedDependency_1.isResolvedDependency)(dep)) {
                checkDep(dep.absolutePath);
            }
        });
        // Then push the JS after the siblings.
        if (getCssMetadata(next) && isTypeJSModule(next)) {
            pushCssModule(next);
        }
    }
    checkDep(entryFile);
    return assets;
}
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
    // TODO(@kitten): As of metro@0.83.2 but maybe before, this does not look correct. Encoding has changed, see: https://github.com/facebook/metro/commit/cb02cdb
    // Decode if the path is encoded from the Metro dev server, then normalize paths for Windows support.
    const decoded = decodeURIComponent(filepath).replace(/\\/g, '/');
    return getFileName(decoded) + '-' + (0, hash_1.hashString)(src);
}
function getFileName(module) {
    return path_1.default.basename(module).replace(/\.[^.]+$/, '');
}
//# sourceMappingURL=getCssDeps.js.map