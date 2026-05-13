"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadConfigAsync = void 0;
const require_utils_1 = require("@expo/require-utils");
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const memoize_1 = require("../memoize");
const utils_1 = require("../utils");
const mockedNativeModules = path_1.default.join(__dirname, '..', '..', 'node_modules_mock');
/**
 * Load the `react-native.config.js` or `react-native.config.ts` from the package.
 */
exports.loadConfigAsync = (0, memoize_1.memoize)(async function loadConfigAsync(packageRoot) {
    const configPath = (await Promise.all(['react-native.config.js', 'react-native.config.ts'].map(async (fileName) => {
        const file = path_1.default.join(packageRoot, fileName);
        return (await (0, utils_1.fileExistsAsync)(file)) ? file : null;
    }))).find((path) => path != null);
    if (configPath) {
        const mod = (0, require_utils_1.evalModule)(await promises_1.default.readFile(configPath, 'utf8'), configPath, 
        // NOTE: We need to mock the Community CLI temporarily, because
        // some packages are checking the version of the CLI in the `react-native.config.js` file.
        // We can remove this once we remove this check from packages.
        { paths: [mockedNativeModules] });
        return mod.default ?? mod ?? null;
    }
    else {
        return null;
    }
});
//# sourceMappingURL=config.js.map