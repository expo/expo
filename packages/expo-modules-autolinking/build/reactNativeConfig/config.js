"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadConfigAsync = void 0;
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const require_from_string_1 = __importDefault(require("require-from-string"));
const resolve_from_1 = __importDefault(require("resolve-from"));
const utils_1 = require("./utils");
let tsMain = undefined;
/**
 * Load the `react-native.config.js` or `react-native.config.ts` from the package.
 */
async function loadConfigAsync(packageRoot) {
    const configJsPath = path_1.default.join(packageRoot, 'react-native.config.js');
    if (await (0, utils_1.fileExistsAsync)(configJsPath)) {
        try {
            return require(configJsPath);
        }
        catch {
            return null;
        }
    }
    const configTsPath = path_1.default.join(packageRoot, 'react-native.config.ts');
    if (await (0, utils_1.fileExistsAsync)(configTsPath)) {
        if (tsMain === undefined) {
            const tsPath = resolve_from_1.default.silent(packageRoot, 'typescript');
            if (tsPath) {
                tsMain = require(tsPath);
            }
        }
        else if (tsMain == null) {
            return null;
        }
        const configContents = await promises_1.default.readFile(configTsPath, 'utf8');
        const transpiledContents = tsMain?.transpileModule(configContents, {
            compilerOptions: {
                module: tsMain.ModuleKind.NodeNext,
                moduleResolution: tsMain.ModuleResolutionKind.NodeNext,
                target: tsMain.ScriptTarget.ESNext,
            },
        });
        const outputText = transpiledContents?.outputText;
        let config;
        try {
            config = outputText ? (0, require_from_string_1.default)(outputText) : null;
        }
        catch { }
        return config?.default ?? config ?? null;
    }
    return null;
}
exports.loadConfigAsync = loadConfigAsync;
//# sourceMappingURL=config.js.map