"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetch = void 0;
const node_process_1 = require("node:process");
/**
 * Wrap fetch in an assertion check to ensure fetch is available.
 * @todo(cedric): drop when supporting a minimum Node version that does not disable `fetch`.
 */
function wrapFetchWithAssert(fetchFunction) {
    return (...args) => {
        if (!fetchFunction) {
            if (node_process_1.env.NODE_OPTIONS?.includes('--no-experimental-fetch')) {
                throw new Error('NODE_OPTIONS="--no-experimental-fetch" is not supported, Node.js built-in fetch is required to continue.');
            }
            throw new Error('Node.js built-in Fetch is not available. Ensure that the Fetch API, first available in Node.js 18, is enabled.');
        }
        return fetchFunction(...args);
    };
}
/** Export a fetch method that ensures fetch is available */
exports.fetch = wrapFetchWithAssert(globalThis.fetch);
//# sourceMappingURL=fetch.js.map