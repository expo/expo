"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMinifier = void 0;
exports.resolveMinifier = resolveMinifier;
const path_1 = __importDefault(require("path"));
const moduleMapper_1 = require("./moduleMapper");
var getMinifier_1 = require("@expo/metro/metro-transform-worker/utils/getMinifier");
Object.defineProperty(exports, "getMinifier", { enumerable: true, get: function () { return __importDefault(getMinifier_1).default; } });
function resolveMinifier(request) {
    // We have to imitate how `getMinifier` resolves the minifier
    // It does so by requiring the `minifierPath` from the `metro-transform-worker/utils/getMinifier` base path
    // This means that when we're trying to resolve the minifier, we need to redirect the resolution to `metro-transform-worker`
    const moduleMapper = (0, moduleMapper_1.createModuleMapper)();
    const metroTransformWorkerPath = moduleMapper('metro-transform-worker/package.json');
    if (metroTransformWorkerPath) {
        try {
            return require.resolve(request, {
                paths: [path_1.default.dirname(metroTransformWorkerPath)],
            });
        }
        catch (error) {
            if (error.code !== 'MODULE_NOT_FOUND') {
                throw error;
            }
        }
    }
    return require.resolve(request);
}
//# sourceMappingURL=getMinifier.js.map