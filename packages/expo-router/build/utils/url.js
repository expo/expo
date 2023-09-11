"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hasUrlProtocolPrefix = void 0;
/**
 * Does the input string start with a valid URL scheme.
 * NOTE: Additional strictness added to ensure URLs sent in query parameters for in-app navigation are not matched.
 */
function hasUrlProtocolPrefix(href) {
    return /^[\w\d_+.-]+:\/\//.test(href);
}
exports.hasUrlProtocolPrefix = hasUrlProtocolPrefix;
//# sourceMappingURL=url.js.map