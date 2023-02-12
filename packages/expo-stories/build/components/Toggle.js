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
exports.Toggle = void 0;
var React = __importStar(require("react"));
var react_native_1 = require("react-native");
var ToggleContext = React.createContext({
    isOpen: false,
    setIsOpen: function () { },
});
function Container(_a) {
    var children = _a.children;
    var _b = React.useState(false), isOpen = _b[0], setIsOpen = _b[1];
    return React.createElement(ToggleContext.Provider, { value: { isOpen: isOpen, setIsOpen: setIsOpen } }, children);
}
function Area(_a) {
    var children = _a.children;
    var isOpen = React.useContext(ToggleContext).isOpen;
    if (!isOpen) {
        return null;
    }
    return React.createElement(React.Fragment, null, children);
}
function Button(_a) {
    var children = _a.children;
    var _b = React.useContext(ToggleContext), isOpen = _b.isOpen, setIsOpen = _b.setIsOpen;
    return React.createElement(react_native_1.TouchableOpacity, { onPress: function () { return setIsOpen(!isOpen); } }, children);
}
exports.Toggle = {
    Container: Container,
    Button: Button,
    Area: Area,
};
//# sourceMappingURL=Toggle.js.map