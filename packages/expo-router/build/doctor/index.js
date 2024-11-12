"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.doctor = void 0;
const debug_1 = __importDefault(require("debug"));
const subset_1 = __importDefault(require("semver/ranges/subset"));
const debug = (0, debug_1.default)('expo:router:doctor');
/**
 * Small hack to get the package.json.
 * We do no use import() as this would require changing the rootDir in `tsconfig.json`,
 * which in turn will change the structure of the outDir.
 */
const routerPkg = require('../../package.json');
const routerDependencies = Object.entries(Object.assign({}, routerPkg.dependencies, routerPkg.peerDependencies)).filter((entry) => entry[1] !== '*');
function doctor(pkg, appReactNavigationPath, 
// Reuse the formatting functions from expo-cli
{ bold, learnMore, }) {
    const resolvedDependencies = { ...pkg.dependencies, ...pkg.devDependencies };
    const libReactNavigationPath = require.resolve('@react-navigation/native');
    const userExcluded = new Set(pkg.expo?.install?.exclude);
    const incorrectDependencies = [];
    /**
     * If the user has a dependency with a sub-dependency on @react-navigation/native, this may install a different
     * version of @react-navigation/native than the one required by expo-router.
     *
     * To detect this, we require the caller of this function to first resolve their path to @react-navigation/native, as
     * they will get the 'top' level package. When expo-router resolves the path to @react-navigation/native, if it is different
     * when the versions must not have matched and the package manager installed a nested node_module folder with a different
     * version of @react-navigation/native.
     */
    if (userExcluded.has('@react-navigation/native') &&
        appReactNavigationPath !== libReactNavigationPath) {
        console.warn(`Detected multiple versions of ${bold('@react-navigation/native')} in your ${bold('node_modules')}. This may lead to unexpected navigation behavior and errors. ${learnMore('https://expo.fyi/router-navigation-deps')}.`);
    }
    for (const [dep, allowedRange] of routerDependencies) {
        if (userExcluded.has(dep)) {
            debug(`Skipping ${dep} because it is excluded in the config`);
            continue;
        }
        const usersRange = resolvedDependencies[dep];
        /**
         * routerDependencies contains all the dependencies that are required by expo-router,
         * both peerDependencies and dependencies. If the user has not manually installed
         * them, then we should skip them.
         */
        if (!usersRange) {
            continue;
        }
        debug(`Checking ${dep} with ${allowedRange} and found ${usersRange}`);
        if (!usersRange || (0, subset_1.default)(allowedRange, usersRange)) {
            continue;
        }
        debug(`Incorrect dependency found for ${dep}`);
        incorrectDependencies.push({
            packageName: dep,
            packageType: pkg.dependencies && dep in pkg.dependencies ? 'dependencies' : 'devDependencies',
            expectedVersionOrRange: allowedRange,
            actualVersion: usersRange,
        });
    }
    return incorrectDependencies;
}
exports.doctor = doctor;
//# sourceMappingURL=index.js.map