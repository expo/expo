"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireContext = void 0;
exports.inMemoryContext = inMemoryContext;
exports.normalizeKey = normalizeKey;
exports.findDuplicateKeys = findDuplicateKeys;
exports.normalizeKeys = normalizeKeys;
exports.requireContextWithOverrides = requireContextWithOverrides;
const path_1 = __importDefault(require("path"));
const require_context_ponyfill_1 = __importDefault(require("./require-context-ponyfill"));
exports.requireContext = require_context_ponyfill_1.default;
const validExtensions = ['.js', '.jsx', '.ts', '.tsx'];
function inMemoryContext(context) {
    return Object.assign(function (id) {
        id = id.replace(/^\.\//, '').replace(/\.\w*$/, '');
        return typeof context[id] === 'function' ? { default: context[id] } : context[id];
    }, {
        resolve: (key) => key,
        id: '0',
        keys: () => Object.keys(context).map((key) => {
            const ext = path_1.default.extname(key);
            key = key.replace(/^\.\//, '');
            key = key.startsWith('/') ? key : `./${key}`;
            key = validExtensions.includes(ext) ? key : `${key}.js`;
            return key;
        }),
    });
}
function normalizeKey(key) {
    const withoutPrefix = key.replace(/^\.\//, '');
    const ext = path_1.default.extname(withoutPrefix);
    return validExtensions.includes(ext) ? withoutPrefix.slice(0, -ext.length) : withoutPrefix;
}
function findDuplicateKeys(normalizedKeys) {
    return normalizedKeys.filter((normalizedKey, index) => normalizedKeys.indexOf(normalizedKey) !== index);
}
/**
 * Maps `requireContext` keys (`./name.ext`) to the extension-free, prefix-free
 * form used by `inMemoryContext` override keys (e.g. `_layout`, `nested/route`).
 *
 * The returned record is keyed by the normalized key and holds the original
 * require-context key, so a normalized key can be resolved back to the file it
 * came from. When two files normalize to the same key (e.g. both `index.jsx`
 * and `index.tsx`), it throws, matching the ambiguity `requireContext` cannot
 * represent.
 */
function normalizeKeys(keys) {
    const normalizedKeys = keys.map(normalizeKey);
    const duplicateKeys = findDuplicateKeys(normalizedKeys);
    if (duplicateKeys.length > 0) {
        throw new Error(`Multiple routes resolved to the same route: ${duplicateKeys.join(', ')}`);
    }
    return Object.fromEntries(keys.map((key) => [normalizeKey(key), key]));
}
function requireContextWithOverrides(dir, overrides) {
    const rawContext = (0, require_context_ponyfill_1.default)(path_1.default.resolve(process.cwd(), dir));
    // Normalize the require-context keys (`./name.ext`) to the extension-free form
    // used by override keys, so `overrides` can be matched directly.
    const normalizedKeys = normalizeKeys(rawContext.keys());
    const existingContext = Object.assign((id) => rawContext(normalizedKeys[id] ?? id), {
        keys: () => Object.keys(normalizedKeys),
    });
    const uniqueKeys = Array.from(new Set([...Object.keys(overrides), ...existingContext.keys()]));
    return Object.assign(function (id) {
        if (id in overrides) {
            const route = overrides[id];
            return typeof route === 'function' ? { default: route } : route;
        }
        else {
            return existingContext(id);
        }
    }, {
        keys: () => [...uniqueKeys],
        resolve: (key) => key,
        id: '0',
    });
}
//# sourceMappingURL=context-stubs.js.map