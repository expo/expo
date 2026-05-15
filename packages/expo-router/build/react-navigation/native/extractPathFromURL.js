"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractPathFromURL = extractPathFromURL;
const escape_string_regexp_1 = __importDefault(require("escape-string-regexp"));
function extractPathFromURL(prefixes, url) {
    for (const prefix of prefixes) {
        const protocol = prefix.match(/^[^:]+:/)?.[0] ?? '';
        const host = prefix
            .replace(new RegExp(`^${(0, escape_string_regexp_1.default)(protocol)}`), '')
            .replace(/\/+/g, '/') // Replace multiple slash (//) with single ones
            .replace(/^\//, ''); // Remove extra leading slash
        const prefixRegex = new RegExp(`^${(0, escape_string_regexp_1.default)(protocol)}(/)*${host
            .split('.')
            .map((it) => (it === '*' ? '[^/]+' : (0, escape_string_regexp_1.default)(it)))
            .join('\\.')}`);
        const [originAndPath, ...searchParams] = url.split('?');
        const normalizedURL = originAndPath
            .replace(/\/+/g, '/')
            .concat(searchParams.length ? `?${searchParams.join('?')}` : '');
        if (prefixRegex.test(normalizedURL)) {
            return normalizedURL.replace(prefixRegex, '');
        }
    }
    return undefined;
}
//# sourceMappingURL=extractPathFromURL.js.map