"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.unescapeAndroidString = exports.escapeAndroidString = exports.format = exports.parseXMLAsync = exports._processAndroidXML = exports.readXMLAsync = exports.writeXMLAsync = void 0;
const fs_1 = __importDefault(require("fs"));
const os_1 = require("os");
const path_1 = __importDefault(require("path"));
const xml2js_1 = require("xml2js");
async function writeXMLAsync(options) {
    const xml = format(options.xml);
    await fs_1.default.promises.mkdir(path_1.default.dirname(options.path), { recursive: true });
    await fs_1.default.promises.writeFile(options.path, xml);
}
exports.writeXMLAsync = writeXMLAsync;
async function readXMLAsync(options) {
    let contents = '';
    try {
        contents = await fs_1.default.promises.readFile(options.path, { encoding: 'utf8', flag: 'r' });
    }
    catch {
        // catch and use fallback
    }
    const parser = new xml2js_1.Parser();
    const manifest = await parser.parseStringPromise(contents || options.fallback || '');
    return _processAndroidXML(manifest);
}
exports.readXMLAsync = readXMLAsync;
function _processAndroidXML(manifest) {
    // For strings.xml
    if (Array.isArray(manifest?.resources?.string)) {
        for (const string of manifest?.resources?.string) {
            if (string.$.translatable === 'false' || string.$.translatable === false) {
                continue;
            }
            string._ = unescapeAndroidString(string._);
        }
    }
    return manifest;
}
exports._processAndroidXML = _processAndroidXML;
async function parseXMLAsync(contents) {
    const xml = await new xml2js_1.Parser().parseStringPromise(contents);
    return xml;
}
exports.parseXMLAsync = parseXMLAsync;
const stringTimesN = (n, char) => Array(n + 1).join(char);
function format(manifest, { indentLevel = 2, newline = os_1.EOL } = {}) {
    let xmlInput;
    if (typeof manifest === 'string') {
        xmlInput = manifest;
    }
    else if (manifest.toString) {
        const builder = new xml2js_1.Builder({
            headless: true,
        });
        // For strings.xml
        if (Array.isArray(manifest?.resources?.string)) {
            for (const string of manifest?.resources?.string) {
                if (string.$.translatable === 'false' || string.$.translatable === false) {
                    continue;
                }
                string._ = escapeAndroidString(string._);
            }
        }
        xmlInput = builder.buildObject(manifest);
        return xmlInput;
    }
    else {
        throw new Error(`Invalid XML value passed in: ${manifest}`);
    }
    const indentString = stringTimesN(indentLevel, ' ');
    let formatted = '';
    const regex = /(>)(<)(\/*)/g;
    const xml = xmlInput.replace(regex, `$1${newline}$2$3`);
    let pad = 0;
    xml
        .split(/\r?\n/)
        .map((line) => line.trim())
        .forEach((line) => {
        let indent = 0;
        if (line.match(/.+<\/\w[^>]*>$/)) {
            indent = 0;
        }
        else if (line.match(/^<\/\w/)) {
            if (pad !== 0) {
                pad -= 1;
            }
        }
        else if (line.match(/^<\w([^>]*[^/])?>.*$/)) {
            indent = 1;
        }
        else {
            indent = 0;
        }
        const padding = stringTimesN(pad, indentString);
        formatted += padding + line + newline;
        pad += indent;
    });
    return formatted.trim();
}
exports.format = format;
/**
 * Escapes Android string literals, specifically characters `"`, `'`, `\`, `\n`, `\r`, `\t`
 *
 * @param value unescaped Android XML string literal.
 */
function escapeAndroidString(value) {
    value = value.replace(/[\n\r\t'"@]/g, (m) => {
        switch (m) {
            case '"':
            case "'":
            case '@':
                return '\\' + m;
            case '\n':
                return '\\n';
            case '\r':
                return '\\r';
            case '\t':
                return '\\t';
            default:
                throw new Error(`Cannot escape unhandled XML character: ${m}`);
        }
    });
    if (value.match(/(^\s|\s$)/)) {
        value = '"' + value + '"';
    }
    return value;
}
exports.escapeAndroidString = escapeAndroidString;
function unescapeAndroidString(value) {
    return value.replace(/\\(.)/g, '$1');
}
exports.unescapeAndroidString = unescapeAndroidString;
