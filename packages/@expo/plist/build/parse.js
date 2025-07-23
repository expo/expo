"use strict";
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
exports.parse = parse;
const xmldom_1 = require("@xmldom/xmldom");
const assert_1 = __importDefault(require("assert"));
const TEXT_NODE = 3;
const CDATA_NODE = 4;
const COMMENT_NODE = 8;
/**
 * We ignore raw text (usually whitespace), <!-- xml comments -->,
 * and raw CDATA nodes.
 *
 * @param {Element} node
 * @returns {Boolean}
 * @api private
 */
function shouldIgnoreNode(node) {
    return (node.nodeType === TEXT_NODE || node.nodeType === COMMENT_NODE || node.nodeType === CDATA_NODE);
}
/**
 * Check if the node is empty. Some plist file has such node:
 * <key />
 * this node should be ignored.
 *
 * @see https://github.com/TooTallNate/plist.js/issues/66
 * @param {Element} node
 * @returns {Boolean}
 * @api private
 */
function isEmptyNode(node) {
    return !node.childNodes || node.childNodes.length === 0;
}
/**
 * Parses a Plist XML string. Returns an Object.
 *
 * @param {String} xml - the XML String to decode
 * @returns {Mixed} the decoded value from the Plist XML
 * @api public
 */
function parse(xml) {
    // prevent the parser from logging non-fatal errors
    const doc = new xmldom_1.DOMParser({ errorHandler() { } }).parseFromString(xml);
    (0, assert_1.default)(doc.documentElement.nodeName === 'plist', 'malformed document. First element should be <plist>');
    let plist = parsePlistXML(doc.documentElement);
    // the root <plist> node gets interpreted as an Array,
    // so pull out the inner data first
    if (plist.length === 1)
        plist = plist[0];
    return plist;
}
/**
 * Convert an XML based plist document into a JSON representation.
 *
 * @param {Object} xml_node - current XML node in the plist
 * @returns {Mixed} built up JSON object
 * @api private
 */
function parsePlistXML(node) {
    let i, new_obj, key, new_arr, res, counter;
    if (!node)
        return null;
    if (node.nodeName === 'plist') {
        new_arr = [];
        if (isEmptyNode(node)) {
            return new_arr;
        }
        for (i = 0; i < node.childNodes.length; i++) {
            if (!shouldIgnoreNode(node.childNodes[i])) {
                new_arr.push(parsePlistXML(node.childNodes[i]));
            }
        }
        return new_arr;
    }
    else if (node.nodeName === 'dict') {
        new_obj = {};
        key = null;
        counter = 0;
        if (isEmptyNode(node)) {
            return new_obj;
        }
        for (i = 0; i < node.childNodes.length; i++) {
            if (shouldIgnoreNode(node.childNodes[i]))
                continue;
            if (counter % 2 === 0) {
                (0, assert_1.default)(node.childNodes[i].nodeName === 'key', 'Missing key while parsing <dict/>.');
                key = parsePlistXML(node.childNodes[i]);
            }
            else {
                (0, assert_1.default)(node.childNodes[i].nodeName !== 'key', 'Unexpected key "' + parsePlistXML(node.childNodes[i]) + '" while parsing <dict/>.');
                new_obj[key] = parsePlistXML(node.childNodes[i]);
            }
            counter += 1;
        }
        if (counter % 2 === 1) {
            throw new Error('Missing value for "' + key + '" while parsing <dict/>');
        }
        return new_obj;
    }
    else if (node.nodeName === 'array') {
        new_arr = [];
        if (isEmptyNode(node)) {
            return new_arr;
        }
        for (i = 0; i < node.childNodes.length; i++) {
            if (!shouldIgnoreNode(node.childNodes[i])) {
                res = parsePlistXML(node.childNodes[i]);
                if (res != null)
                    new_arr.push(res);
            }
        }
        return new_arr;
    }
    else if (node.nodeName === '#text') {
        // TODO: what should we do with text types? (CDATA sections)
    }
    else if (node.nodeName === 'key') {
        if (isEmptyNode(node)) {
            return '';
        }
        return node.childNodes[0].nodeValue;
    }
    else if (node.nodeName === 'string') {
        res = '';
        if (isEmptyNode(node)) {
            return res;
        }
        for (i = 0; i < node.childNodes.length; i++) {
            const type = node.childNodes[i].nodeType;
            if (type === TEXT_NODE || type === CDATA_NODE) {
                res += node.childNodes[i].nodeValue;
            }
        }
        return res;
    }
    else if (node.nodeName === 'integer') {
        (0, assert_1.default)(!isEmptyNode(node), 'Cannot parse "" as integer.');
        return parseInt(node.childNodes[0].nodeValue, 10);
    }
    else if (node.nodeName === 'real') {
        (0, assert_1.default)(!isEmptyNode(node), 'Cannot parse "" as real.');
        res = '';
        for (i = 0; i < node.childNodes.length; i++) {
            if (node.childNodes[i].nodeType === TEXT_NODE) {
                res += node.childNodes[i].nodeValue;
            }
        }
        return parseFloat(res);
    }
    else if (node.nodeName === 'data') {
        res = '';
        if (isEmptyNode(node)) {
            return Buffer.from(res, 'base64');
        }
        for (i = 0; i < node.childNodes.length; i++) {
            if (node.childNodes[i].nodeType === TEXT_NODE) {
                res += node.childNodes[i].nodeValue.replace(/\s+/g, '');
            }
        }
        return Buffer.from(res, 'base64');
    }
    else if (node.nodeName === 'date') {
        (0, assert_1.default)(!isEmptyNode(node), 'Cannot parse "" as Date.');
        return new Date(node.childNodes[0].nodeValue);
    }
    else if (node.nodeName === 'true') {
        return true;
    }
    else if (node.nodeName === 'false') {
        return false;
    }
}
//# sourceMappingURL=parse.js.map