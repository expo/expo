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
var MaterialCommunityIcons_1 = __importDefault(require("@expo/vector-icons/build/MaterialCommunityIcons"));
var react_1 = __importDefault(require("react"));
var react_native_1 = require("react-native");
var icon = function (name) { return react_1.default.createElement(MaterialCommunityIcons_1.default, { key: name, name: name, size: 24 }); };
// A custom button that shows examples of different share sheet configurations
var ShowActionSheetButton = /** @class */ (function (_super) {
    __extends(ShowActionSheetButton, _super);
    function ShowActionSheetButton() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this._showActionSheet = function () {
            var _a = _this.props, withTitle = _a.withTitle, withMessage = _a.withMessage, withIcons = _a.withIcons, withSeparators = _a.withSeparators, withCustomStyles = _a.withCustomStyles, onSelection = _a.onSelection, showActionSheetWithOptions = _a.showActionSheetWithOptions;
            // Same interface as https://facebook.github.io/react-native/docs/actionsheetios.html
            var options = ['Delete', 'Save', 'Share', 'Cancel'];
            var icons = withIcons
                ? [icon('delete'), icon('content-save'), icon('share'), icon('cancel')]
                : undefined;
            var title = withTitle ? 'Choose An Action' : undefined;
            var message = withMessage
                ? 'This library tries to mimic the native share sheets as close as possible.'
                : undefined;
            var destructiveButtonIndex = 0;
            var cancelButtonIndex = 3;
            var textStyle = withCustomStyles
                ? { fontSize: 20, fontWeight: '500', color: 'blue' }
                : undefined;
            var titleTextStyle = withCustomStyles
                ? {
                    fontSize: 24,
                    textAlign: 'center',
                    fontWeight: '700',
                    color: 'orange',
                }
                : undefined;
            var messageTextStyle = withCustomStyles
                ? { fontSize: 12, color: 'purple', textAlign: 'right' }
                : undefined;
            showActionSheetWithOptions({
                options: options,
                cancelButtonIndex: cancelButtonIndex,
                destructiveButtonIndex: destructiveButtonIndex,
                title: title,
                message: message,
                icons: icons,
                tintIcons: true,
                showSeparators: withSeparators,
                textStyle: textStyle,
                titleTextStyle: titleTextStyle,
                messageTextStyle: messageTextStyle,
            }, function (buttonIndex) {
                // Do something here depending on the button index selected
                onSelection(buttonIndex);
            });
        };
        return _this;
    }
    ShowActionSheetButton.prototype.render = function () {
        var title = this.props.title;
        return (react_1.default.createElement(react_native_1.View, { style: { margin: 6 } },
            react_1.default.createElement(MaterialCommunityIcons_1.default.Button, { name: "code-tags", backgroundColor: "#3e3e3e", onPress: this._showActionSheet },
                react_1.default.createElement(react_native_1.Text, { style: {
                        fontSize: 15,
                        color: '#fff',
                    } }, title))));
    };
    ShowActionSheetButton.defaultProps = {
        withTitle: false,
        withMessage: false,
        withIcons: false,
        withSeparators: false,
        withCustomStyles: false,
        onSelection: null,
    };
    return ShowActionSheetButton;
}(react_1.default.PureComponent));
exports.default = ShowActionSheetButton;
//# sourceMappingURL=ShowActionSheetButton.js.map