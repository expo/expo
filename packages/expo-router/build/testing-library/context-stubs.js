"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireContextWithOverrides = exports.inMemoryContext = exports.requireContext = void 0;
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
exports.inMemoryContext = inMemoryContext;
function requireContextWithOverrides(dir, overrides) {
    const existingContext = (0, require_context_ponyfill_1.default)(path_1.default.resolve(process.cwd(), dir));
    return Object.assign(function (id) {
        if (id in overrides) {
            const route = overrides[id];
            return typeof route === 'function' ? { default: route } : route;
        }
        else {
            return existingContext(id);
        }
    }, {
        keys: () => [...Object.keys(overrides), ...existingContext.keys()],
        resolve: (key) => key,
        id: '0',
    });
}
exports.requireContextWithOverrides = requireContextWithOverrides;
//# sourceMappingURL=context-stubs.js.map