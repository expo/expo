"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports._assertNodeFetchSupport = _assertNodeFetchSupport;
// Add assertions to improve usage in non-standard environments.
function _assertNodeFetchSupport({ Request, Response, process } = globalThis) {
    // Check if Request and Response are available.
    if (typeof Request === 'undefined' || typeof Response === 'undefined') {
        // Detect if `--no-experimental-fetch` flag is enabled and warn that it must be disabled.
        if (typeof process !== 'undefined' && process.env && process.env.NODE_OPTIONS) {
            const nodeOptions = process.env.NODE_OPTIONS;
            if (nodeOptions.includes('--no-experimental-fetch')) {
                throw new Error('NODE_OPTIONS="--no-experimental-fetch" is not supported with Expo server. Node.js built-in Request/Response APIs are required to continue.');
            }
        }
        // If Node.js is <18, throw an error.
        if (typeof process !== 'undefined' && process.version) {
            const version = process.version;
            const majorVersion = parseInt(version.replace(/v/g, '').split('.')[0], 10);
            if (majorVersion < 18) {
                throw new Error(`Node.js version ${majorVersion} is not supported. Upgrade to Node.js 20 or newer.`);
            }
        }
        // Default error event for missing APIs.
        throw new Error('Node built-in Request/Response APIs are not available. Ensure that Node Fetch API, first available in Node.js 18, is enabled.');
    }
}
// If this is in the wrong place (called after Request/Response are used), then a less helpful error such as `Request is not defined` will be thrown.
_assertNodeFetchSupport();
//# sourceMappingURL=assertion.js.map