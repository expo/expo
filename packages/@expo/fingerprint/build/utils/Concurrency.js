"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createLimiter = void 0;
const createLimiter = (limit = 1) => {
    let running = 0;
    let head = null;
    let tail = null;
    const enqueue = () => new Promise((resolve) => {
        const item = { resolve, next: null };
        if (tail) {
            tail.next = item;
            tail = item;
        }
        else {
            head = item;
            tail = item;
        }
    });
    const dequeue = () => {
        if (running < limit && head !== null) {
            const { resolve, next } = head;
            head.next = null;
            head = next;
            if (head === null) {
                tail = null;
            }
            running++;
            resolve();
        }
    };
    return async (fn, ...args) => {
        if (running < limit) {
            running++;
        }
        else {
            await enqueue();
        }
        try {
            return await fn(...args);
        }
        finally {
            running--;
            dequeue();
        }
    };
};
exports.createLimiter = createLimiter;
//# sourceMappingURL=Concurrency.js.map