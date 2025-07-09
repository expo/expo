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
    debug;
    _isTransformed = undefined;
    constructor(source, transformFn, debug) {
        super();
        this.source = source;
        this.transformFn = transformFn;
        this.debug = debug;
    }
    /**
     * Indicates whether the file content has been transformed.
     * @returns boolean value if `debug` is true, otherwise the value would be undefined.
     */
    get isTransformed() {
        return this._isTransformed;
    }
    //#region - Transform implementations
    _transform(chunk, encoding, callback) {
        const result = this.transformFn(this.source, chunk, false /* isEndOfFile */, encoding);
        if (this.debug) {
            this._isTransformed ||= chunk !== result;
        }
        if (result) {
            this.push(result);
        }
        callback();
    }
    _flush(callback) {
        const result = this.transformFn(this.source, null, true /* isEndOfFile */, 'utf8');
        if (result) {
            this.push(result);
        }
        callback();
    }
}
exports.FileHookTransform = FileHookTransform;
//# sourceMappingURL=FileHookTransform.js.map