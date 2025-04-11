"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createExpoPages = createExpoPages;
const create_pages_1 = require("./create-pages");
/**
 * Wrapper around `createPages` to pass data from the server to the fn
 *
 * This is separated from the `createPages` function allowing us to keep the createPages
 * in sync with the original Waku implementation.
 *
 * @param fn
 * @returns
 */
function createExpoPages(fn) {
    return (getRouteOptions) => {
        return {
            default: (0, create_pages_1.createPages)((a, b) => fn(a, { ...b, getRouteOptions })),
        };
    };
}
//# sourceMappingURL=create-expo-pages.js.map