"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const code_frame_1 = require("@babel/code-frame");
const json5_1 = __importDefault(require("json5"));
const node_fs_1 = __importDefault(require("node:fs"));
const node_path_1 = __importDefault(require("node:path"));
const node_util_1 = require("node:util");
const write_file_atomic_1 = __importDefault(require("write-file-atomic"));
const JsonFileError_1 = __importStar(require("./JsonFileError"));
const writeFileAtomicAsync = (0, node_util_1.promisify)(write_file_atomic_1.default);
const DEFAULT_OPTIONS = {
    badJsonDefault: undefined,
    jsonParseErrorDefault: undefined,
    cantReadFileDefault: undefined,
    ensureDir: false,
    default: undefined,
    json5: false,
    space: 2,
    addNewLineAtEOF: true,
};
/**
 * The JsonFile class represents the contents of json file.
 *
 * It's polymorphic on "JSONObject", which is a simple type representing
 * and object with string keys and either objects or primitive types as values.
 * @type {[type]}
 */
class JsonFile {
    file;
    options;
    static read = read;
    static readAsync = readAsync;
    static parseJsonString = parseJsonString;
    static write = write;
    static writeAsync = writeAsync;
    static get = getSync;
    static getAsync = getAsync;
    static set = setSync;
    static setAsync = setAsync;
    static merge = merge;
    static mergeAsync = mergeAsync;
    static deleteKey = deleteKey;
    static deleteKeyAsync = deleteKeyAsync;
    static deleteKeys = deleteKeys;
    static deleteKeysAsync = deleteKeysAsync;
    static rewrite = rewrite;
    static rewriteAsync = rewriteAsync;
    constructor(file, options = {}) {
        this.file = file;
        this.options = options;
    }
    read(options) {
        return read(this.file, this._getOptions(options));
    }
    async readAsync(options) {
        return readAsync(this.file, this._getOptions(options));
    }
    write(object, options) {
        return write(this.file, object, this._getOptions(options));
    }
    async writeAsync(object, options) {
        return writeAsync(this.file, object, this._getOptions(options));
    }
    parseJsonString(json, options) {
        return parseJsonString(json, options);
    }
    get(key, defaultValue, options) {
        return getSync(this.file, key, defaultValue, this._getOptions(options));
    }
    async getAsync(key, defaultValue, options) {
        return getAsync(this.file, key, defaultValue, this._getOptions(options));
    }
    set(key, value, options) {
        return setSync(this.file, key, value, this._getOptions(options));
    }
    async setAsync(key, value, options) {
        return setAsync(this.file, key, value, this._getOptions(options));
    }
    async merge(sources, options) {
        return merge(this.file, sources, this._getOptions(options));
    }
    async mergeAsync(sources, options) {
        return mergeAsync(this.file, sources, this._getOptions(options));
    }
    deleteKey(key, options) {
        return deleteKey(this.file, key, this._getOptions(options));
    }
    async deleteKeyAsync(key, options) {
        return deleteKeyAsync(this.file, key, this._getOptions(options));
    }
    deleteKeys(keys, options) {
        return deleteKeys(this.file, keys, this._getOptions(options));
    }
    async deleteKeysAsync(keys, options) {
        return deleteKeysAsync(this.file, keys, this._getOptions(options));
    }
    rewrite(options) {
        return rewrite(this.file, this._getOptions(options));
    }
    async rewriteAsync(options) {
        return rewriteAsync(this.file, this._getOptions(options));
    }
    _getOptions(options) {
        return {
            ...this.options,
            ...options,
        };
    }
}
exports.default = JsonFile;
function read(file, options) {
    let json;
    try {
        json = node_fs_1.default.readFileSync(file, 'utf8');
    }
    catch (error) {
        assertEmptyJsonString(json, file);
        const defaultValue = cantReadFileDefault(options);
        if (defaultValue === undefined) {
            throw new JsonFileError_1.default(`Can't read JSON file: ${file}`, error, error.code, file);
        }
        else {
            return defaultValue;
        }
    }
    return parseJsonString(json, options, file);
}
async function readAsync(file, options) {
    let json;
    try {
        json = await node_fs_1.default.promises.readFile(file, 'utf8');
    }
    catch (error) {
        assertEmptyJsonString(json, file);
        const defaultValue = cantReadFileDefault(options);
        if (defaultValue === undefined) {
            throw new JsonFileError_1.default(`Can't read JSON file: ${file}`, error, error.code);
        }
        else {
            return defaultValue;
        }
    }
    return parseJsonString(json, options);
}
function parseJsonString(json, options, fileName) {
    assertEmptyJsonString(json, fileName);
    try {
        if (_getOption(options, 'json5')) {
            return json5_1.default.parse(json);
        }
        else {
            return JSON.parse(json);
        }
    }
    catch (e) {
        const defaultValue = jsonParseErrorDefault(options);
        if (defaultValue === undefined) {
            const location = locationFromSyntaxError(e, json);
            if (location) {
                const codeFrame = (0, code_frame_1.codeFrameColumns)(json, { start: location });
                e.codeFrame = codeFrame;
                e.message += `\n${codeFrame}`;
            }
            throw new JsonFileError_1.default(`Error parsing JSON: ${json}`, e, 'EJSONPARSE', fileName);
        }
        else {
            return defaultValue;
        }
    }
}
function getSync(file, key, defaultValue, options) {
    const object = read(file, options);
    if (key in object) {
        return object[key];
    }
    if (defaultValue === undefined) {
        throw new JsonFileError_1.default(`No value at key path "${String(key)}" in JSON object from: ${file}`);
    }
    return defaultValue;
}
async function getAsync(file, key, defaultValue, options) {
    const object = await readAsync(file, options);
    if (key in object) {
        return object[key];
    }
    if (defaultValue === undefined) {
        throw new JsonFileError_1.default(`No value at key path "${String(key)}" in JSON object from: ${file}`);
    }
    return defaultValue;
}
function write(file, object, options) {
    if (options?.ensureDir) {
        node_fs_1.default.mkdirSync(node_path_1.default.dirname(file), { recursive: true });
    }
    const space = _getOption(options, 'space');
    const json5 = _getOption(options, 'json5');
    const addNewLineAtEOF = _getOption(options, 'addNewLineAtEOF');
    let json;
    try {
        if (json5) {
            json = json5_1.default.stringify(object, null, space);
        }
        else {
            json = JSON.stringify(object, null, space);
        }
    }
    catch (e) {
        throw new JsonFileError_1.default(`Couldn't JSON.stringify object for file: ${file}`, e);
    }
    const data = addNewLineAtEOF ? `${json}\n` : json;
    write_file_atomic_1.default.sync(file, data, {});
    return object;
}
async function writeAsync(file, object, options) {
    if (options?.ensureDir) {
        await node_fs_1.default.promises.mkdir(node_path_1.default.dirname(file), { recursive: true });
    }
    const space = _getOption(options, 'space');
    const json5 = _getOption(options, 'json5');
    const addNewLineAtEOF = _getOption(options, 'addNewLineAtEOF');
    let json;
    try {
        if (json5) {
            json = json5_1.default.stringify(object, null, space);
        }
        else {
            json = JSON.stringify(object, null, space);
        }
    }
    catch (e) {
        throw new JsonFileError_1.default(`Couldn't JSON.stringify object for file: ${file}`, e);
    }
    const data = addNewLineAtEOF ? `${json}\n` : json;
    await writeFileAtomicAsync(file, data, {});
    return object;
}
function setSync(file, key, value, options) {
    // TODO: Consider implementing some kind of locking mechanism, but
    // it's not critical for our use case, so we'll leave it out for now
    const object = read(file, options);
    return write(file, { ...object, [key]: value }, options);
}
async function setAsync(file, key, value, options) {
    // TODO: Consider implementing some kind of locking mechanism, but
    // it's not critical for our use case, so we'll leave it out for now
    const object = await readAsync(file, options);
    return writeAsync(file, { ...object, [key]: value }, options);
}
async function mergeAsync(file, sources, options) {
    const object = await readAsync(file, options);
    if (Array.isArray(sources)) {
        Object.assign(object, ...sources);
    }
    else {
        Object.assign(object, sources);
    }
    return writeAsync(file, object, options);
}
function merge(file, sources, options) {
    const object = read(file, options);
    if (Array.isArray(sources)) {
        Object.assign(object, ...sources);
    }
    else {
        Object.assign(object, sources);
    }
    return write(file, object, options);
}
async function deleteKeyAsync(file, key, options) {
    return deleteKeysAsync(file, [key], options);
}
function deleteKey(file, key, options) {
    return deleteKeys(file, [key], options);
}
async function deleteKeysAsync(file, keys, options) {
    const object = await readAsync(file, options);
    let didDelete = false;
    for (let i = 0; i < keys.length; i++) {
        const key = keys[i];
        if (object.hasOwnProperty(key)) {
            delete object[key];
            didDelete = true;
        }
    }
    if (didDelete) {
        return writeAsync(file, object, options);
    }
    return object;
}
function deleteKeys(file, keys, options) {
    const object = read(file, options);
    let didDelete = false;
    for (let i = 0; i < keys.length; i++) {
        const key = keys[i];
        if (object.hasOwnProperty(key)) {
            delete object[key];
            didDelete = true;
        }
    }
    if (didDelete) {
        return write(file, object, options);
    }
    return object;
}
async function rewriteAsync(file, options) {
    const object = await readAsync(file, options);
    return writeAsync(file, object, options);
}
function rewrite(file, options) {
    return write(file, read(file, options), options);
}
function jsonParseErrorDefault(options = {}) {
    if (options.jsonParseErrorDefault === undefined) {
        return options.default;
    }
    else {
        return options.jsonParseErrorDefault;
    }
}
function cantReadFileDefault(options = {}) {
    if (options.cantReadFileDefault === undefined) {
        return options.default;
    }
    else {
        return options.cantReadFileDefault;
    }
}
function _getOption(options, field) {
    if (options) {
        if (options[field] !== undefined) {
            return options[field];
        }
    }
    return DEFAULT_OPTIONS[field];
}
function locationFromSyntaxError(error, sourceString) {
    // JSON5 SyntaxError has lineNumber and columnNumber.
    if ('lineNumber' in error && 'columnNumber' in error) {
        return { line: error.lineNumber, column: error.columnNumber };
    }
    // JSON SyntaxError only includes the index in the message.
    const match = /at position (\d+)/.exec(error.message);
    if (match) {
        const index = parseInt(match[1], 10);
        const lines = sourceString.slice(0, index + 1).split('\n');
        return { line: lines.length, column: lines[lines.length - 1].length };
    }
    return null;
}
function assertEmptyJsonString(json, file) {
    if (json?.trim() === '') {
        throw new JsonFileError_1.EmptyJsonFileError(file);
    }
}
//# sourceMappingURL=JsonFile.js.map