"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.appleAutolinkConditionMetAsync = appleAutolinkConditionMetAsync;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const APPLE_PROPERTIES_FILE = 'Podfile.properties.json';
/**
 * Evaluates whether a conditional podspec entry should be autolinked.
 *
 * The gate consults the already-resolved dependency set rather than re-resolving, so it
 * stays consistent with how the autolinker actually links native modules.
 *
 * When the context is absent (e.g. the deprecated JS API called without it), an
 * `npmPackage` condition resolves to `false` (the pod is omitted) and a `podfileProperty`
 * condition resolves to linked-unless-explicitly-disabled.
 */
async function appleAutolinkConditionMetAsync(condition, context) {
    if ('npmPackage' in condition && condition.npmPackage) {
        return !!context.resolvedDependencyNames?.has(condition.npmPackage);
    }
    if ('podfileProperty' in condition && condition.podfileProperty) {
        if (!context.commandRoot) {
            return false;
        }
        const properties = readPodfileProperties(context.commandRoot);
        // Linked unless the property is explicitly set to the disabled value.
        return properties[condition.podfileProperty] !== condition.disabledValue;
    }
    return false;
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