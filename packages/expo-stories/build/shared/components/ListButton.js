"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = __importDefault(require("react"));
var react_native_1 = require("react-native");
var Colors_1 = __importDefault(require("../constants/Colors"));
var ListButton = /** @class */ (function (_super) {
    __extends(ListButton, _super);
    function ListButton() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    ListButton.prototype.render = function () {
        var style = [styles.button];
        var labelStyles = [styles.label];
        if (this.props.disabled) {
            style.push(styles.disabledButton);
            labelStyles.push(styles.disabledLabel);
        }
        return (react_1.default.createElement(react_native_1.View, { style: [styles.container, this.props.style] },
            react_1.default.createElement(react_native_1.TouchableHighlight, { style: style, disabled: this.props.disabled, onPress: this.props.onPress, underlayColor: "#dddddd" },
                react_1.default.createElement(react_native_1.Text, { style: labelStyles }, this.props.title))));
    };
    return ListButton;
}(react_1.default.Component));
exports.default = ListButton;
var styles = react_native_1.StyleSheet.create({
    container: {},
    button: {
        paddingVertical: 10,
        backgroundColor: 'transparent',
        borderBottomWidth: 1.0 / react_native_1.PixelRatio.get(),
        borderBottomColor: '#cccccc',
    },
    disabledButton: {},
    label: {
        color: Colors_1.default.tintColor,
        fontWeight: '700',
    },
    disabledLabel: {
        color: '#999999',
    },
});
//# sourceMappingURL=ListButton.js.map