"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = __importDefault(require("react"));
var react_native_1 = require("react-native");
var Colors_1 = __importDefault(require("../constants/Colors"));
var Button = function (_a) {
    var disabled = _a.disabled, loading = _a.loading, title = _a.title, onPress = _a.onPress, onPressIn = _a.onPressIn, style = _a.style, buttonStyle = _a.buttonStyle, children = _a.children;
    return (react_1.default.createElement(react_native_1.View, { style: [styles.container, style] },
        react_1.default.createElement(react_native_1.TouchableHighlight, { style: [styles.button, disabled && styles.disabledButton, buttonStyle], disabled: disabled || loading, onPressIn: onPressIn, onPress: onPress, underlayColor: Colors_1.default.highlightColor }, children ||
            (loading ? (react_1.default.createElement(react_native_1.ActivityIndicator, { size: "small", color: "white" })) : (react_1.default.createElement(react_native_1.Text, { style: styles.label }, title))))));
};
var styles = react_native_1.StyleSheet.create({
    container: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    button: {
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 3,
        paddingVertical: 8,
        paddingHorizontal: 12,
        backgroundColor: Colors_1.default.tintColor,
    },
    disabledButton: {
        backgroundColor: Colors_1.default.disabled,
    },
    label: {
        color: '#ffffff',
        fontWeight: '700',
    },
});
exports.default = Button;
//# sourceMappingURL=Button.js.map