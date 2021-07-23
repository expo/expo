"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var html_elements_1 = require("@expo/html-elements");
var react_1 = __importDefault(require("react"));
var react_native_1 = require("react-native");
function TitleSwitch(_a) {
    var style = _a.style, titleStyle = _a.titleStyle, title = _a.title, value = _a.value, setValue = _a.setValue, disabled = _a.disabled;
    var outputTitle = disabled ? title + " (Disabled)" : title;
    return (react_1.default.createElement(react_native_1.View, { style: [styles.container, style] },
        react_1.default.createElement(html_elements_1.B, { style: [styles.title, titleStyle] }, outputTitle),
        react_1.default.createElement(react_native_1.Switch, { disabled: disabled, value: value, onValueChange: function (value) { return setValue(value); } })));
}
exports.default = TitleSwitch;
var styles = react_native_1.StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 12,
        justifyContent: 'space-between',
    },
    title: {
        marginRight: 12,
    },
    text: {
        marginVertical: 15,
        maxWidth: '80%',
        marginHorizontal: 10,
    },
});
//# sourceMappingURL=TitledSwitch.js.map