"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetch = void 0;
const fetch_1 = require("expo/fetch");
const errors_1 = require("./errors");
async function fetch(input, init) {
    //   throw new NetworkError('test error', input as string);
    try {
        return await (0, fetch_1.fetch)(input, init);
    }
    catch (error) {
        const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
        if (error instanceof Error) {
            if (error.message.match(/(Network request failed|fetch failed): (The network connection was lost|Could not connect to the server)/)) {
                throw new errors_1.NetworkError(error.message, url);
            }
        }
        throw error;
    }
}
exports.fetch = fetch;
//# sourceMappingURL=fetch.js.map