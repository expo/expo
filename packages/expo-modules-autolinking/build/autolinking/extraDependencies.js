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
async function getBuildPropertiesAsync() {
    const projectRoot = path_1.default.dirname(mergeLinkingOptions_1.projectPackageJsonPath);
    const { exp: config } = await (0, config_1.getConfig)(projectRoot, { skipSDKVersionRequirement: true });
    const buildPropertiesPlugin = config.plugins?.find((item) => item[0] === 'expo-build-properties')?.[1];
    return buildPropertiesPlugin ?? {};
}
exports.getBuildPropertiesAsync = getBuildPropertiesAsync;
/**
 * Resolves the extra dependencies from `expo-build-properties` settings.
 */
async function resolveExtraDependenciesAsync() {
    const buildProps = await getBuildPropertiesAsync();
    return {
        androidMavenRepos: buildProps.android?.extraMavenRepos ?? [],
        iosPods: buildProps.ios?.extraPods ?? {},
    };
}
exports.resolveExtraDependenciesAsync = resolveExtraDependenciesAsync;
//# sourceMappingURL=extraDependencies.js.map