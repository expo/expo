"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var react_native_1 = require("react-native");
var Colors_1 = __importDefault(require("./Colors"));
exports.default = {
    error: react_native_1.StyleSheet.create({
        container: {
            backgroundColor: Colors_1.default.errorBackground,
        },
        text: {
            color: Colors_1.default.errorText,
        },
    }),
    warning: react_native_1.StyleSheet.create({
        container: {
            backgroundColor: Colors_1.default.warningBackground,
        },
        text: {
            color: Colors_1.default.warningText,
        },
    }),
    notice: react_native_1.StyleSheet.create({
        container: {
            backgroundColor: Colors_1.default.noticeBackground,
        },
        text: {
            color: Colors_1.default.noticeText,
        },
    }),
};
//# sourceMappingURL=Alerts.js.map