"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.transformJsAssetToHermesBytecodeAsync = transformJsAssetToHermesBytecodeAsync;
const assert_1 = __importDefault(require("assert"));
const path_1 = __importDefault(require("path"));
const debugId_1 = require("./debugId");
// Lazy-loaded to avoid pulling in metro-source-map at startup
let _buildHermesBundleAsync;
function getBuildHermesBundleAsync() {
    if (!_buildHermesBundleAsync) {
        _buildHermesBundleAsync = require('./exportHermes').buildHermesBundleAsync;
    }
    return _buildHermesBundleAsync;
}
async function transformJsAssetToHermesBytecodeAsync(projectRoot, jsAsset, mapAsset) {
    if (Buffer.isBuffer(jsAsset.source))
        return;
    const debugId = (0, debugId_1.stringToUUID)(path_1.default.basename(jsAsset.filename, path_1.default.extname(jsAsset.filename)));
    const adjustedSource = jsAsset.source.replace(/^\/\/# (sourceMappingURL)=(.*)$/gm, (...props) => {
        if (props[1] === 'sourceMappingURL') {
            const mapName = props[2].replace(/\.js\.map$/, '.hbc.map');
            return `//# ${props[1]}=` + mapName;
        }
        return '';
    });
    const hermesBundleOutput = await getBuildHermesBundleAsync()({
        projectRoot,
        filename: path_1.default.resolve(projectRoot, jsAsset.originFilename),
        code: adjustedSource,
        map: mapAsset ? mapAsset.source : null,
        // TODO: Maybe allow prod + no minify.
        minify: true,
    });
    if (hermesBundleOutput.hbc) {
        // TODO: Unclear if we should add multiple assets, link the assets, or mutate the first asset.
        // @ts-expect-error: TODO
        jsAsset.source = hermesBundleOutput.hbc;
        jsAsset.filename = jsAsset.filename.replace(/\.js$/, '.hbc');
        if (jsAsset.metadata.paths) {
            const rewrittenPaths = { ...jsAsset.metadata.paths };
            for (const [moduleId, modulePaths] of Object.entries(rewrittenPaths)) {
                const rewrittenModulePaths = { ...modulePaths };
                for (const [dependencyId, targetPath] of Object.entries(modulePaths)) {
                    (0, assert_1.default)(targetPath == null || typeof targetPath === 'string', 'Hermes async paths must remain scalar.');
                    rewrittenModulePaths[dependencyId] = targetPath
                        ? targetPath.replace(/\.js$/, '.hbc')
                        : targetPath;
                }
                rewrittenPaths[moduleId] = rewrittenModulePaths;
            }
            jsAsset.metadata.paths = rewrittenPaths;
        }
    }
    if (mapAsset && hermesBundleOutput.sourcemap) {
        const sourceMap = JSON.parse(hermesBundleOutput.sourcemap);
        sourceMap.debugId = debugId;
        mapAsset.source = JSON.stringify(sourceMap);
        mapAsset.filename = mapAsset.filename.replace(/\.js\.map$/, '.hbc.map');
    }
}
//# sourceMappingURL=hermesArtifacts.js.map