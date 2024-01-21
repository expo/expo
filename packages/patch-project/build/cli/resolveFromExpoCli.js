"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveFromExpoCli = void 0;
const path_1 = __importDefault(require("path"));
const resolve_from_1 = __importDefault(require("resolve-from"));
let cachedCliPath = null;
/**
 * Resolve a module from the @expo/cli package.
 */
function resolveFromExpoCli(projectRoot, moduleId) {
    if (cachedCliPath == null) {
        const expoPackageRoot = path_1.default.dirname((0, resolve_from_1.default)(projectRoot, 'expo/package.json'));
        cachedCliPath = path_1.default.dirname((0, resolve_from_1.default)(expoPackageRoot, '@expo/cli/package.json'));
    }
    return path_1.default.join(cachedCliPath, moduleId);
}
exports.resolveFromExpoCli = resolveFromExpoCli;
//# sourceMappingURL=resolveFromExpoCli.js.map