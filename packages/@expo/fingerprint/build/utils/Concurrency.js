"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createLimiter = void 0;
const createLimiter = (limit = 4) => {
    const pending = new Set();
    return async (fn, ...args) => {
        while (pending.size >= limit) {
            await Promise.race(pending);
        }
        const promise = Promise.resolve(fn(...args)).finally(() => {
            pending.delete(promise);
        });
        pending.add(promise);
        return await promise;
    };
};
exports.createLimiter = createLimiter;
//# sourceMappingURL=Concurrency.js.map