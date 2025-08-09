"use strict";
/**
 * Copyright © 2025 650 Industries.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ImmutableRequest = void 0;
exports.assertRuntimeFetchAPISupport = assertRuntimeFetchAPISupport;
// This provides a better error message when ImmutableRequest is used in a non-standard JS runtime.
assertRuntimeFetchAPISupport();
/**
 * An immutable version of the Fetch API's [`Headers`](https://developer.mozilla.org/en-US/docs/Web/API/Headers) object which prevents mutations.
 */
class ImmutableHeaders extends Headers {
    // TODO(@hassankhan): Merge with `ReadonlyHeaders` from `expo-router`
    #throwImmutableError() {
        throw new Error('This operation is not allowed on immutable headers.');
    }
    set() {
        this.#throwImmutableError();
    }
    append() {
        this.#throwImmutableError();
    }
    delete() {
        this.#throwImmutableError();
    }
}
/**
 * An immutable version of the Fetch API's [`Request`](https://developer.mozilla.org/en-US/docs/Web/API/Request) object which prevents mutations to the request body and headers.
 */
class ImmutableRequest {
    #headers;
    #request;
    constructor(request) {
        this.#headers = new ImmutableHeaders(request.headers);
        this.#request = request;
    }
    get cache() {
        return this.#request.cache;
    }
    get credentials() {
        return this.#request.credentials;
    }
    get destination() {
        return this.#request.destination;
    }
    get integrity() {
        return this.#request.integrity;
    }
    get keepalive() {
        return this.#request.keepalive;
    }
    get method() {
        return this.#request.method;
    }
    get mode() {
        return this.#request.mode;
    }
    get redirect() {
        return this.#request.redirect;
    }
    get referrer() {
        return this.#request.referrer;
    }
    get referrerPolicy() {
        return this.#request.referrerPolicy;
    }
    get signal() {
        return this.#request.signal;
    }
    get url() {
        return this.#request.url;
    }
    get bodyUsed() {
        return this.#request.bodyUsed;
    }
    get duplex() {
        return this.#request.duplex;
    }
    get headers() {
        return this.#headers;
    }
    #throwImmutableBodyError() {
        throw new Error('This operation is not allowed on immutable requests.');
    }
    /**
     * The request body is not accessible in immutable requests.
     */
    // @ts-expect-error This ensures JavaScript users cannot mutate the request body
    // eslint-disable-next-line getter-return
    get body() {
        this.#throwImmutableBodyError();
    }
    async arrayBuffer() {
        this.#throwImmutableBodyError();
    }
    async blob() {
        this.#throwImmutableBodyError();
    }
    async bytes() {
        this.#throwImmutableBodyError();
    }
    async formData() {
        this.#throwImmutableBodyError();
    }
    async json() {
        this.#throwImmutableBodyError();
    }
    async text() {
        this.#throwImmutableBodyError();
    }
    /**
     * Creates a mutable clone of the original request. This is provided as an escape hatch.
     */
    clone() {
        return this.#request.clone();
    }
}
exports.ImmutableRequest = ImmutableRequest;
// Add assertions to improve usage in non-standard environments.
function assertRuntimeFetchAPISupport({ Request, Response, Headers, process, } = globalThis) {
    // Check if Request and Response are available.
    if (typeof Request === 'undefined' ||
        typeof Response === 'undefined' ||
        typeof Headers === 'undefined') {
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
        throw new Error('Runtime built-in Request/Response/Headers APIs are not available. If running Node ensure that Node Fetch API, first available in Node.js 18, is enabled.');
    }
}
//# sourceMappingURL=ImmutableRequest.js.map