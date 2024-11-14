"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetch = void 0;
const fetch_1 = require("expo/fetch");
const errors_1 = require("./errors");
async function fetch(input, init) {
    try {
        return await (0, fetch_1.fetch)(input, init);
    }
    catch (error) {
        if (error instanceof Error) {
            if (error.message.match(/(Network request failed|fetch failed): (The network connection was lost|Could not connect to the server)/)) {
                throw new errors_1.NetworkError(error.message, input);
            }
        }
        throw error;
    }
}
exports.fetch = fetch;
//# sourceMappingURL=fetch.js.map