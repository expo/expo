"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SuspenseFallback = SuspenseFallback;
const react_1 = __importDefault(require("react"));
const Toast_1 = require("./Toast");
function SuspenseFallback({ route }) {
    if (__DEV__) {
        return (<Toast_1.ToastWrapper>
        <Toast_1.Toast filename={route}>Bundling...</Toast_1.Toast>
      </Toast_1.ToastWrapper>);
    }
    return null;
}
//# sourceMappingURL=SuspenseFallback.js.map