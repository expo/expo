"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hasUrlProtocolPrefix = hasUrlProtocolPrefix;
exports.isWellKnownUri = isWellKnownUri;
exports.shouldLinkExternally = shouldLinkExternally;
/**
 * Does the input string start with a valid URL scheme.
 * NOTE: Additional strictness added to ensure URLs sent in query parameters for in-app navigation are not matched.
 */
function hasUrlProtocolPrefix(href) {
    return /^([\w\d_+.-]+:)?\/\//.test(href);
}
function isWellKnownUri(href) {
    // This is a hack and we should change this to work like the web in the future where we have full confidence in the
    // ability to match URLs and send anything unmatched to the OS. The main difference between this and `hasUrlProtocolPrefix` is
    // that we don't require `//`, e.g. `mailto:` is valid and common, and `mailto://bacon` is invalid.
    return /^(https?|mailto|tel|sms|geo|maps|market|itmss?|itms-apps|content|file):/.test(href);
}
function shouldLinkExternally(href) {
    // Cheap check first to avoid regex if the href is not a path fragment.
    return !href.startsWith('.') && (hasUrlProtocolPrefix(href) || isWellKnownUri(href));
}
//# sourceMappingURL=url.js.map