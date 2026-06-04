"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.appleAutolinkConditionMetAsync = appleAutolinkConditionMetAsync;
const fs_1 = __importDefault(require("fs"));
const node_module_1 = __importDefault(require("node:module"));
const path_1 = __importDefault(require("path"));
const dependencies_1 = require("../../dependencies");
const utils_1 = require("../../utils");
const APPLE_PROPERTIES_FILE = 'Podfile.properties.json';
/**
 * Evaluates whether a conditional podspec entry should be autolinked.
 *
 * This runs in the autolinking resolver — the component that already resolves the
 * dependency graph — so installability is checked in-process rather than from a
 * subprocess at `pod install` time.
 */
async function appleAutolinkConditionMetAsync(condition, context) {
    if ('npmPackage' in condition && condition.npmPackage) {
        const packageName = condition.npmPackage;
        const appRoot = context.appRoot;
        if (!appRoot) {
            return false;
        }
        // Cheap, hoist-aware check first; fall back to a deep dependency-graph walk for strict
        // (non-hoisted) layouts where a transitively-installed package isn't directly reachable
        // from the project root — e.g. pnpm with `node-linker=isolated`.
        return ((await isPackageHoistResolvable(packageName, appRoot)) ||
            (await isPackageInDependencyGraph(packageName, appRoot)));
    }
    if ('podfileProperty' in condition && condition.podfileProperty) {
        const propertiesRoot = context.commandRoot ?? context.appRoot;
        if (!propertiesRoot) {
            return false;
        }
        const properties = readPodfileProperties(propertiesRoot);
        // Linked unless the property is explicitly set to the disabled value.
        return properties[condition.podfileProperty] !== condition.disabledValue;
    }
    return false;
}
/** True when `packageName`'s `package.json` is reachable from `fromDir` via Node's node_modules lookup. */
async function isPackageHoistResolvable(packageName, fromDir) {
    try {
        for (const modulePath of node_module_1.default._nodeModulePaths(fromDir)) {
            const packageJsonPath = await (0, utils_1.maybeRealpath)((0, utils_1.fastJoin)((0, utils_1.fastJoin)(modulePath, packageName), 'package.json'));
            if (packageJsonPath != null) {
                return true;
            }
        }
    }
    catch {
        // ignore and report not resolvable
    }
    return false;
}
/** True when `packageName` appears anywhere in the recursively-resolved dependency graph. */
async function isPackageInDependencyGraph(packageName, appRoot) {
    try {
        const result = await (0, dependencies_1.scanDependenciesRecursively)(appRoot);
        return result[packageName] != null;
    }
    catch {
        return false;
    }
}
function readPodfileProperties(nativeRoot) {
    try {
        return JSON.parse(fs_1.default.readFileSync(path_1.default.join(nativeRoot, APPLE_PROPERTIES_FILE), 'utf8'));
    }
    catch {
        return {};
    }
}
//# sourceMappingURL=autolinkCondition.js.map