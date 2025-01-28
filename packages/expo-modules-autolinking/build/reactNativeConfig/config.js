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
const fileUtils_1 = require("../fileUtils");
let tsMain = undefined;
const mockedNativeModules = path_1.default.join(__dirname, '..', '..', 'node_modules_mock');
/**
 * Load the `react-native.config.js` or `react-native.config.ts` from the package.
 */
async function loadConfigAsync(packageRoot) {
    const configJsPath = path_1.default.join(packageRoot, 'react-native.config.js');
    if (await (0, fileUtils_1.fileExistsAsync)(configJsPath)) {
        return requireConfig(configJsPath, await promises_1.default.readFile(configJsPath, 'utf8'));
    }
    const configTsPath = path_1.default.join(packageRoot, 'react-native.config.ts');
    if (await (0, fileUtils_1.fileExistsAsync)(configTsPath)) {
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
        if (outputText) {
            return requireConfig(configTsPath, outputText);
        }
    }
    return null;
}
exports.loadConfigAsync = loadConfigAsync;
/**
 * Temporarily, we need to mock the community CLI, because
 * some packages are checking the version of the CLI in the `react-native.config.js` file.
 * We can remove this once we remove this check from packages.
 */
function requireConfig(filepath, configContents) {
    try {
        const config = (0, require_from_string_1.default)(configContents, filepath, {
            prependPaths: [mockedNativeModules],
        });
        return config.default ?? config ?? null;
    }
    catch {
        return null;
    }
}
//# sourceMappingURL=config.js.map