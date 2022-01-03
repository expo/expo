"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.error = error;
exports.warn = warn;
exports.log = log;
exports.exit = exit;
exports.timeEnd = exports.time = void 0;
var _getenv = require("getenv");
const isProfiling = (0, _getenv).boolish('EXPO_PROFILE', false);
const time = isProfiling ? console.time : ()=>{};
exports.time = time;
const timeEnd = isProfiling ? console.timeEnd : ()=>{};
exports.timeEnd = timeEnd;
function error(...message) {
    console.error(...message);
}
function warn(...message) {
    console.warn(...message);
}
function log(...message) {
    console.log(...message);
}
function exit(message, code = 1) {
    if (code === 0) {
        console.log(message);
    } else {
        error(message);
    }
    process.exit(code);
}

//# sourceMappingURL=log.js.map