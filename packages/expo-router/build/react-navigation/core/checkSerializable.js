"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkSerializable = checkSerializable;
const checkSerializableWithoutCircularReference = (o, seen, location) => {
    if (o === undefined ||
        o === null ||
        typeof o === 'boolean' ||
        typeof o === 'number' ||
        typeof o === 'string') {
        return { serializable: true };
    }
    if (Object.prototype.toString.call(o) !== '[object Object]' && !Array.isArray(o)) {
        return {
            serializable: false,
            location,
            reason: typeof o === 'function' ? 'Function' : String(o),
        };
    }
    if (seen.has(o)) {
        return {
            serializable: false,
            reason: 'Circular reference',
            location,
        };
    }
    seen.add(o);
    if (Array.isArray(o)) {
        for (let i = 0; i < o.length; i++) {
            const childResult = checkSerializableWithoutCircularReference(o[i], new Set(seen), [
                ...location,
                i,
            ]);
            if (!childResult.serializable) {
                return childResult;
            }
        }
    }
    else {
        for (const key in o) {
            const childResult = checkSerializableWithoutCircularReference(o[key], new Set(seen), [
                ...location,
                key,
            ]);
            if (!childResult.serializable) {
                return childResult;
            }
        }
    }
    return { serializable: true };
};
function checkSerializable(o) {
    return checkSerializableWithoutCircularReference(o, new Set(), []);
}
//# sourceMappingURL=checkSerializable.js.map