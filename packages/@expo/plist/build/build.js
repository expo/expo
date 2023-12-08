"use strict";
/* eslint-disable */
/* (The MIT License)

Copyright (c) 2010-2017 Nathan Rajlich <nathan@tootallnate.net>

Permission is hereby granted, free of charge, to any person
obtaining a copy of this software and associated documentation
files (the "Software"), to deal in the Software without
restriction, including without limitation the rights to use,
copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the
Software is furnished to do so, subject to the following
conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
OTHER DEALINGS IN THE SOFTWARE. */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.build = void 0;
const base64_js_1 = __importDefault(require("base64-js"));
const xmlbuilder_1 = __importDefault(require("xmlbuilder"));
/**
 * Accepts a `Date` instance and returns an ISO date string.
 *
 * @param {Date} d - Date instance to serialize
 * @returns {String} ISO date string representation of `d`
 * @api private
 */
function ISODateString(d) {
    function pad(n) {
        return n < 10 ? '0' + n : n;
    }
    return (d.getUTCFullYear() +
        '-' +
        pad(d.getUTCMonth() + 1) +
        '-' +
        pad(d.getUTCDate()) +
        'T' +
        pad(d.getUTCHours()) +
        ':' +
        pad(d.getUTCMinutes()) +
        ':' +
        pad(d.getUTCSeconds()) +
        'Z');
}
/**
 * Returns the internal "type" of `obj` via the
 * `Object.prototype.toString()` trick.
 *
 * @param {Mixed} obj - any value
 * @returns {String} the internal "type" name
 * @api private
 */
const toString = Object.prototype.toString;
function type(obj) {
    const m = toString.call(obj).match(/\[object (.*)\]/);
    return m ? m[1] : m;
}
/**
 * Generate an XML plist string from the input object `obj`.
 *
 * @param {Object} obj - the object to convert
 * @param {Object} [opts] - optional options object
 * @returns {String} converted plist XML string
 * @api public
 */
function build(obj, opts) {
    const XMLHDR = {
        version: '1.0',
        encoding: 'UTF-8',
    };
    const XMLDTD = {
        pubid: '-//Apple//DTD PLIST 1.0//EN',
        sysid: 'http://www.apple.com/DTDs/PropertyList-1.0.dtd',
    };
    const doc = xmlbuilder_1.default.create('plist');
    doc.dec(XMLHDR.version, XMLHDR.encoding, XMLHDR.standalone);
    doc.dtd(XMLDTD.pubid, XMLDTD.sysid);
    doc.att('version', '1.0');
    walk_obj(obj, doc);
    if (!opts)
        opts = {};
    // default `pretty` to `true`
    opts.pretty = opts.pretty !== false;
    return doc.end(opts);
}
exports.build = build;
/**
 * depth first, recursive traversal of a javascript object. when complete,
 * next_child contains a reference to the build XML object.
 *
 * @api private
 */
function walk_obj(next, next_child) {
    let tag_type, i, prop;
    const name = type(next);
    if (name == 'Undefined') {
    }
    else if (Array.isArray(next)) {
        next_child = next_child.ele('array');
        for (i = 0; i < next.length; i++) {
            walk_obj(next[i], next_child);
        }
    }
    else if (Buffer.isBuffer(next)) {
        next_child.ele('data').raw(next.toString('base64'));
    }
    else if (name == 'Object') {
        next_child = next_child.ele('dict');
        for (prop in next) {
            if (next.hasOwnProperty(prop) && next[prop] !== undefined) {
                next_child.ele('key').txt(prop);
                walk_obj(next[prop], next_child);
            }
        }
    }
    else if (name == 'Number') {
        // detect if this is an integer or real
        // TODO: add an ability to force one way or another via a "cast"
        tag_type = next % 1 === 0 ? 'integer' : 'real';
        next_child.ele(tag_type).txt(next.toString());
    }
    else if (name == 'Date') {
        next_child.ele('date').txt(ISODateString(new Date(next)));
    }
    else if (name == 'Boolean') {
        next_child.ele(next ? 'true' : 'false');
    }
    else if (name == 'String') {
        next_child.ele('string').txt(next);
    }
    else if (name == 'ArrayBuffer') {
        next_child.ele('data').raw(base64_js_1.default.fromByteArray(next));
    }
    else if (next && next.buffer && type(next.buffer) == 'ArrayBuffer') {
        // a typed array
        next_child.ele('data').raw(base64_js_1.default.fromByteArray(new Uint8Array(next.buffer)));
    }
}
//# sourceMappingURL=build.js.map