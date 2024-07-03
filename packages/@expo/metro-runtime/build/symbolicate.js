"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getStackFormattedLocation = exports.parseErrorStack = exports.LogBoxLog = void 0;
const LogBoxLog_1 = require("./error-overlay/Data/LogBoxLog");
Object.defineProperty(exports, "LogBoxLog", { enumerable: true, get: function () { return LogBoxLog_1.LogBoxLog; } });
const parseErrorStack_1 = __importDefault(require("./error-overlay/modules/parseErrorStack"));
exports.parseErrorStack = parseErrorStack_1.default;
var formatProjectFilePath_1 = require("./error-overlay/formatProjectFilePath");
Object.defineProperty(exports, "getStackFormattedLocation", { enumerable: true, get: function () { return formatProjectFilePath_1.getStackFormattedLocation; } });
//# sourceMappingURL=symbolicate.js.map