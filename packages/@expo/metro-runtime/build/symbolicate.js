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
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseErrorStack = exports.LogBoxLog = void 0;
const LogBoxLog_1 = require("./error-overlay/Data/LogBoxLog");
Object.defineProperty(exports, "LogBoxLog", { enumerable: true, get: function () { return LogBoxLog_1.LogBoxLog; } });
const parseErrorStack_1 = __importDefault(require("./error-overlay/modules/parseErrorStack"));
exports.parseErrorStack = parseErrorStack_1.default;
__exportStar(require("./error-overlay/formatProjectFilePath"), exports);
//# sourceMappingURL=symbolicate.js.map