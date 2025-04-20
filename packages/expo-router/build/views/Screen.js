"use strict";
'use client';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Screen = Screen;
const react_1 = __importDefault(require("react"));
const useNavigation_1 = require("../useNavigation");
const useLayoutEffect = typeof window !== 'undefined' ? react_1.default.useLayoutEffect : function () { };
/** Component for setting the current screen's options dynamically. */
function Screen({ name, options }) {
    const navigation = (0, useNavigation_1.useNavigation)(name);
    useLayoutEffect(() => {
        if (options &&
            // React Navigation will infinitely loop in some cases if an empty object is passed to setOptions.
            // https://github.com/expo/router/issues/452
            Object.keys(options).length) {
            navigation.setOptions(options);
        }
    }, [navigation, options]);
    return null;
}
//# sourceMappingURL=Screen.js.map