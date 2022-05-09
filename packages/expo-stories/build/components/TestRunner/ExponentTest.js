"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var getenv_1 = __importDefault(require("getenv"));
var react_native_1 = require("react-native");
// Used for bare android device farm builds
var ExponentTest = (react_native_1.NativeModules && react_native_1.NativeModules.ExponentTest) || {
    get isInCI() {
        return getenv_1.default.boolish('CI', false);
    },
    log: console.log,
    completed: function () {
        // noop
    },
    action: function () {
        // noop
    },
};
exports.default = ExponentTest;
//# sourceMappingURL=ExponentTest.js.map