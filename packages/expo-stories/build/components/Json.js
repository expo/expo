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
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Json = void 0;
var styleguide_native_1 = require("@expo/styleguide-native");
var React = __importStar(require("react"));
var react_native_1 = require("react-native");
function Json(_a) {
    var _b = _a.json, json = _b === void 0 ? {} : _b;
    return (React.createElement(react_native_1.View, { style: styles.container },
        React.createElement(react_native_1.Text, { style: styles.text }, JSON.stringify(json, null, '\t'))));
}
exports.Json = Json;
var styles = react_native_1.StyleSheet.create({
    container: {
        backgroundColor: styleguide_native_1.lightTheme.background.tertiary,
        borderRadius: styleguide_native_1.borderRadius.large,
        padding: styleguide_native_1.spacing[4],
    },
    text: {
        fontSize: 15,
        fontWeight: '500',
        color: styleguide_native_1.lightTheme.text.default,
    },
});
//# sourceMappingURL=Json.js.map