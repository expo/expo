"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Env {
    /** Determine if the package manager is running in a CI environment. */
    get CI() {
        // See: https://github.com/ctavan/node-getenv/blob/5b02feebde5d8edd56fff7d81c4b43403a20aff8/index.js#L63-L74
        const { CI } = process.env;
        return CI?.toLowerCase() === 'true' || CI === '1';
    }
}
exports.default = new Env();
//# sourceMappingURL=env.js.map