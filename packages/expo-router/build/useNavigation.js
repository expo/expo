"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveParentId = exports.useNavigation = void 0;
const native_1 = require("@react-navigation/native");
const react_1 = __importDefault(require("react"));
const Route_1 = require("./Route");
const matchers_1 = require("./matchers");
/**
 * Return the navigation object for the current route.
 * @param parent Provide an absolute path like `/(root)` to the parent route or a relative path like `../../` to the parent route.
 * @returns the navigation object for the provided route.
 */
function useNavigation(parent) {
    const navigation = (0, native_1.useNavigation)();
    const contextKey = (0, Route_1.useContextKey)();
    const normalizedParent = react_1.default.useMemo(() => {
        if (!parent) {
            return null;
        }
        const normalized = (0, matchers_1.getNameFromFilePath)(parent);
        if (parent.startsWith('.')) {
            return relativePaths(contextKey, parent);
        }
        return normalized;
    }, [contextKey, parent]);
    if (normalizedParent != null) {
        const parentNavigation = navigation.getParent(normalizedParent);
        // TODO: Maybe print a list of parents...
        if (!parentNavigation) {
            throw new Error(`Could not find parent navigation with route "${parent}".` +
                (normalizedParent !== parent ? ` (normalized: ${normalizedParent})` : ''));
        }
        return parentNavigation;
    }
    return navigation;
}
exports.useNavigation = useNavigation;
function resolveParentId(contextKey, parentId) {
    if (!parentId) {
        return null;
    }
    if (parentId.startsWith('.')) {
        return (0, matchers_1.getNameFromFilePath)(relativePaths(contextKey, parentId));
    }
    return (0, matchers_1.getNameFromFilePath)(parentId);
}
exports.resolveParentId = resolveParentId;
// Resolve a path like `../` relative to a path like `/foo/bar`
function relativePaths(from, to) {
    const fromParts = from.split('/').filter(Boolean);
    const toParts = to.split('/').filter(Boolean);
    for (const part of toParts) {
        if (part === '..') {
            if (fromParts.length === 0) {
                throw new Error(`Cannot resolve path "${to}" relative to "${from}"`);
            }
            fromParts.pop();
        }
        else if (part === '.') {
            // Ignore
        }
        else {
            fromParts.push(part);
        }
    }
    return '/' + fromParts.join('/');
}
//# sourceMappingURL=useNavigation.js.map