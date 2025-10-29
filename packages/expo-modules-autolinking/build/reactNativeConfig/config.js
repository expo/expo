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
const utils_1 = require("../utils");
let tsMain = undefined;
const mockedNativeModules = path_1.default.join(__dirname, '..', '..', 'node_modules_mock');
/**
 * Load the `react-native.config.js` or `react-native.config.ts` from the package.
 */
exports.loadConfigAsync = (0, utils_1.memoize)(async function loadConfigAsync(packageRoot) {
    const [configJsPath, configTsPath] = await Promise.all(['react-native.config.js', 'react-native.config.ts'].map(async (fileName) => {
        const file = path_1.default.join(packageRoot, fileName);
        return (await (0, utils_1.fileExistsAsync)(file)) ? file : null;
    }));
    if (configJsPath) {
        return requireConfig(configJsPath, await promises_1.default.readFile(configJsPath, 'utf8'));
    }
    if (configTsPath) {
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
});
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