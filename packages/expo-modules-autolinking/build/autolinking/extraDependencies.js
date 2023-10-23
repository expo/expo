"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveExtraDependenciesAsync = exports.getBuildPropertiesAsync = void 0;
const config_1 = require("@expo/config");
const path_1 = __importDefault(require("path"));
const mergeLinkingOptions_1 = require("./mergeLinkingOptions");
/**
 * Gets the `expo-build-properties` settings from the app config.
 */
async function getBuildPropertiesAsync(projectRoot) {
    const projectPackageRoot = path_1.default.dirname(await (0, mergeLinkingOptions_1.getProjectPackageJsonPathAsync)(projectRoot));
    const { exp: config } = await (0, config_1.getConfig)(projectPackageRoot, { skipSDKVersionRequirement: true });
    const buildPropertiesPlugin = config.plugins?.find((item) => item[0] === 'expo-build-properties')?.[1];
    return buildPropertiesPlugin ?? {};
}
exports.getBuildPropertiesAsync = getBuildPropertiesAsync;
/**
 * Resolves the extra dependencies from `expo-build-properties` settings.
 */
async function resolveExtraDependenciesAsync(projectRoot) {
    const buildProps = await getBuildPropertiesAsync(projectRoot);
    return {
        androidMavenRepos: buildProps.android?.extraMavenRepos ?? [],
        iosPods: buildProps.ios?.extraPods ?? {},
    };
}
exports.resolveExtraDependenciesAsync = resolveExtraDependenciesAsync;
//# sourceMappingURL=extraDependencies.js.map