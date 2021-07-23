"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
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
exports.HeaderContainerRight = void 0;
var Ionicons_1 = __importDefault(require("@expo/vector-icons/build/Ionicons"));
var React = __importStar(require("react"));
var react_native_1 = require("react-native");
function HeaderContainerRight(props) {
    return React.createElement(react_native_1.View, __assign({}, props, { style: [{ paddingRight: 8, flexDirection: 'row' }, props.style] }));
}
exports.HeaderContainerRight = HeaderContainerRight;
function HeaderIconButton(_a) {
    var _b = _a.color, color = _b === void 0 ? 'blue' : _b, disabled = _a.disabled, name = _a.name, onPress = _a.onPress, _c = _a.size, size = _c === void 0 ? 24 : _c;
    return (React.createElement(react_native_1.TouchableOpacity, { disabled: disabled, style: { paddingHorizontal: 12 }, onPress: onPress },
        React.createElement(Ionicons_1.default, { size: size, color: color, name: name })));
}
exports.default = HeaderIconButton;
//# sourceMappingURL=HeaderIconButton.js.map