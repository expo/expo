"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileHookTransform = void 0;
const stream_1 = require("stream");
/**
 * A transform stream that allows to hook into file contents and transform them.
 */
class FileHookTransform extends stream_1.Transform {
    source;
    transformFn;
    constructor(source, transformFn) {
        super();
        this.source = source;
        this.transformFn = transformFn;
    }
    _transform(chunk, _encoding, callback) {
        const result = this.transformFn(this.source, chunk, _encoding);
        this.push(result);
        callback();
    }
}
exports.FileHookTransform = FileHookTransform;
//# sourceMappingURL=FileHookTransform.js.map