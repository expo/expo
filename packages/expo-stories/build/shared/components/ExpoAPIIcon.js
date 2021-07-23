"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = __importDefault(require("react"));
var react_native_1 = require("react-native");
var Icons_1 = __importDefault(require("../constants/Icons"));
function ExpoAPIIcon(_a) {
    var name = _a.name, style = _a.style;
    var icon = react_1.default.useMemo(function () { return (Icons_1.default[name] || Icons_1.default.Default)(); }, [name]);
    return react_1.default.createElement(react_native_1.Image, { source: icon, style: [{ width: 24, height: 24 }, style] });
}
exports.default = ExpoAPIIcon;
//# sourceMappingURL=ExpoAPIIcon.js.map