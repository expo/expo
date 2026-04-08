"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.transitiveResolveFrom = transitiveResolveFrom;
const resolve_from_1 = __importDefault(require("resolve-from"));
/**
 * ResolveFrom.silent that accepts transitive module IDs.
 *
 * @example
 * transitiveResolveFrom(projectRoot, ['expo/package.json', 'expo-modules-core/package.json'])
 */
function transitiveResolveFrom(projectRoot, moduleIds) {
    for (const moduleId of moduleIds) {
        const resolved = resolve_from_1.default.silent(projectRoot, moduleId);
        if (resolved) {
            return resolved;
        }
    }
    return null;
}
//# sourceMappingURL=transitiveResolveFrom.js.map