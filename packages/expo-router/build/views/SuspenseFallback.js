"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SuspenseFallback = void 0;
const react_1 = __importDefault(require("react"));
const Toast_1 = require("./Toast");
function SuspenseFallback({ route }) {
    return (react_1.default.createElement(Toast_1.ToastWrapper, null,
        react_1.default.createElement(Toast_1.Toast, { filename: route?.contextKey }, "Bundling...")));
}
exports.SuspenseFallback = SuspenseFallback;
//# sourceMappingURL=SuspenseFallback.js.map