"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = ShowMoreButton;
const react_1 = __importDefault(require("react"));
const Constants_1 = require("./Constants");
function ShowMoreButton({ message, collapsed, onPress, }) {
    if (message.content.length < Constants_1.SHOW_MORE_MESSAGE_LENGTH || !collapsed) {
        return null;
    }
    return (react_1.default.createElement("button", { style: {
            color: 'var(--expo-log-color-label)',
            fontFamily: 'var(--expo-log-font-family)',
            backgroundColor: 'transparent',
            cursor: 'pointer',
            border: 'none',
            opacity: 0.7,
            fontSize: 14,
        }, onClick: onPress }, "... See more"));
}
