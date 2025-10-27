"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.memoize = memoize;
const MAX_SIZE = 5_000;
function memoize(fn) {
    const cache = new Map();
    return async (input, ...args) => {
        if (!cache.has(input)) {
            const result = await fn(input, ...args);
            if (cache.size > MAX_SIZE) {
                cache.clear();
            }
            cache.set(input, result);
            return result;
        }
        else {
            return cache.get(input);
        }
    };
}
//# sourceMappingURL=utils.js.map