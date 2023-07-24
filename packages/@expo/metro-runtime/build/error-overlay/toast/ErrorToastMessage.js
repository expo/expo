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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ErrorToastMessage = void 0;
const react_views_1 = require("@bacons/react-views");
const react_1 = __importDefault(require("react"));
const LogBoxMessage_1 = require("../UI/LogBoxMessage");
const LogBoxStyle = __importStar(require("../UI/LogBoxStyle"));
function ErrorToastMessage({ message }) {
    return (react_1.default.createElement(react_views_1.Text, { numberOfLines: 1, style: styles.text }, message && (react_1.default.createElement(LogBoxMessage_1.LogBoxMessage, { plaintext: true, message: message, style: styles.substitutionText }))));
}
exports.ErrorToastMessage = ErrorToastMessage;
const styles = react_views_1.StyleSheet.create({
    text: {
        userSelect: "none",
        paddingLeft: 8,
        color: LogBoxStyle.getTextColor(1),
        flex: 1,
        fontSize: 14,
        lineHeight: 22,
    },
    substitutionText: {
        color: LogBoxStyle.getTextColor(0.6),
    },
});
//# sourceMappingURL=ErrorToastMessage.js.map