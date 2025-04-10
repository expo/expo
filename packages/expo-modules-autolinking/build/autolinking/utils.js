"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLinkingImplementationForPlatform = getLinkingImplementationForPlatform;
exports.getIsolatedModulesPath = getIsolatedModulesPath;
const path_1 = __importDefault(require("path"));
function getLinkingImplementationForPlatform(platform) {
    switch (platform) {
        case 'ios':
        case 'macos':
        case 'tvos':
        case 'apple':
            return require('../platforms/apple');
        case 'android':
            return require('../platforms/android');
        case 'devtools':
            return require('../platforms/devtools');
    }
}
/**
 * Get the possible path to the pnpm isolated modules folder.
 */
function getIsolatedModulesPath(packagePath, packageName) {
    // Check if the project is using isolated modules, by checking
    // if the parent dir of `packagePath` is a `node_modules` folder.
    // Isolated modules installs dependencies in small groups such as:
    //   - /.pnpm/expo@50.x.x(...)/node_modules/@expo/cli
    //   - /.pnpm/expo@50.x.x(...)/node_modules/expo
    //   - /.pnpm/expo@50.x.x(...)/node_modules/expo-application
    // When isolated modules are detected, expand the `searchPaths`
    // to include possible nested dependencies.
    const maybeIsolatedModulesPath = path_1.default.join(packagePath, packageName.startsWith('@') && packageName.includes('/') ? '../..' : '..' // scoped packages are nested deeper
    );
    const isIsolatedModulesPath = path_1.default.basename(maybeIsolatedModulesPath) === 'node_modules';
    return isIsolatedModulesPath ? maybeIsolatedModulesPath : null;
}
//# sourceMappingURL=utils.js.map