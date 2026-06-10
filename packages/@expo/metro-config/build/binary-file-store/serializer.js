"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.encode = encode;
exports.decode = decode;
const { Packr } = require('./vendor/msgpackr');
const packr = new Packr({
    useRecords: true,
    moreTypes: true,
    // NOTE(@kitten): Preserved from the previous msgpackr-backed store for cache-entry performance.
    bundleStrings: true,
});
function encode(value) {
    return packr.encode(value);
}
function decode(buffer) {
    return packr.decode(buffer);
}
//# sourceMappingURL=serializer.js.map