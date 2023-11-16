"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.trimQuotes = void 0;
function trimQuotes(s) {
    return s && s[0] === '"' && s[s.length - 1] === '"' ? s.slice(1, -1) : s;
}
exports.trimQuotes = trimQuotes;
