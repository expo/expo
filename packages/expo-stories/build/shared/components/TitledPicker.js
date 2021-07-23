"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
var html_elements_1 = require("@expo/html-elements");
var picker_1 = require("@react-native-picker/picker");
var React = __importStar(require("react"));
var react_native_1 = require("react-native");
function TitledPicker(_a) {
    var style = _a.style, titleStyle = _a.titleStyle, title = _a.title, value = _a.value, setValue = _a.setValue, items = _a.items, disabled = _a.disabled;
    var outputTitle = disabled ? title + " (Disabled)" : title;
    return (React.createElement(react_native_1.View, { style: [styles.container, style] },
        React.createElement(html_elements_1.B, { style: [styles.title, titleStyle] }, outputTitle),
        React.createElement(picker_1.Picker, { selectedValue: value, enabled: !disabled, onValueChange: function (value) { return setValue("" + value); } }, items.map(function (_a) {
            var key = _a.key, value = _a.value;
            return (React.createElement(picker_1.Picker.Item, { label: value, value: key, key: key }));
        }))));
}
exports.default = TitledPicker;
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
//# sourceMappingURL=TitledPicker.js.map