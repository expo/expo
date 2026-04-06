"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FooterComponent = FooterComponent;
const react_1 = __importDefault(require("react"));
const react_native_screens_1 = require("react-native-screens");
function FooterComponent({ children }) {
    return <react_native_screens_1.ScreenFooter collapsable={false}>{children}</react_native_screens_1.ScreenFooter>;
}
//# sourceMappingURL=FooterComponent.js.map