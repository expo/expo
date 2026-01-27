"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hasUrlProtocolPrefix = hasUrlProtocolPrefix;
exports.isWellKnownUri = isWellKnownUri;
exports.shouldLinkExternally = shouldLinkExternally;
exports.parseUrlUsingCustomBase = parseUrlUsingCustomBase;
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
function parseUrlUsingCustomBase(href) {
    // NOTE(@kitten): This used to use a dummy base URL for parsing (phony [.] example)
    // However, this seems to get flagged since it's preserved 1:1 in the output bytecode by certain scanners
    // Instead, we use an empty `file:` URL. This will still perform `pathname` normalization, search parameter parsing
    // encoding, and all other logic, except the logic that applies to hostnames and protocols, and also not leave a
    // dummy URL in the output bytecode
    return new URL(href, 'file:');
}
//# sourceMappingURL=url.js.map