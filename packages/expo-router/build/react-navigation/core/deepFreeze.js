"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deepFreeze = exports.isPlainObject = void 0;
const isPlainObject = (value) => {
    if (typeof value === 'object' && value !== null) {
        return Object.getPrototypeOf(value) === Object.prototype;
    }
    return false;
};
exports.isPlainObject = isPlainObject;
const deepFreeze = (object) => {
    // We only freeze in development to catch issues early
    // Don't freeze in production to avoid unnecessary performance overhead
    if (process.env.NODE_ENV === 'production') {
        return object;
    }
    if (Object.isFrozen(object)) {
        return object;
    }
    if (!(0, exports.isPlainObject)(object) && !Array.isArray(object)) {
        return object;
    }
    // Freeze properties before freezing self
    for (const key in object) {
        // Don't freeze objects in params since they are passed by the user
        if (key !== 'params') {
            if (Object.getOwnPropertyDescriptor(object, key)?.configurable) {
                const value = object[key];
                (0, exports.deepFreeze)(value);
            }
        }
    }
    return Object.freeze(object);
};
exports.deepFreeze = deepFreeze;
//# sourceMappingURL=deepFreeze.js.map