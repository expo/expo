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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var Ionicons_1 = __importDefault(require("@expo/vector-icons/build/Ionicons"));
var react_1 = __importDefault(require("react"));
var react_native_1 = require("react-native");
var Colors_1 = __importDefault(require("../constants/Colors"));
function SearchBar(_a) {
    var selectionColor = _a.selectionColor, _b = _a.tintColor, tintColor = _b === void 0 ? Colors_1.default.tintColor : _b, _c = _a.placeholderTextColor, placeholderTextColor = _c === void 0 ? '#ccc' : _c, _d = _a.underlineColorAndroid, underlineColorAndroid = _d === void 0 ? '#ccc' : _d, textColor = _a.textColor, onSubmit = _a.onSubmit, onChangeQuery = _a.onChangeQuery, _e = _a.initialValue, initialValue = _e === void 0 ? '' : _e;
    var _f = react_1.default.useState(initialValue), text = _f[0], setText = _f[1];
    var _textInput = react_1.default.useRef(null);
    react_1.default.useEffect(function () {
        requestAnimationFrame(function () {
            var _a;
            (_a = _textInput.current) === null || _a === void 0 ? void 0 : _a.focus();
        });
    }, []);
    var _handleClear = function () {
        _handleChangeText('');
    };
    var _handleChangeText = function (text) {
        setText(text);
        onChangeQuery === null || onChangeQuery === void 0 ? void 0 : onChangeQuery(text);
    };
    var _handleSubmit = function () {
        var _a;
        onSubmit === null || onSubmit === void 0 ? void 0 : onSubmit(text);
        (_a = _textInput.current) === null || _a === void 0 ? void 0 : _a.blur();
    };
    var searchInputStyle = {};
    if (textColor) {
        searchInputStyle.color = textColor;
    }
    return (react_1.default.createElement(react_native_1.View, { style: styles.container },
        react_1.default.createElement(react_native_1.TextInput, { ref: _textInput, placeholder: "Search", placeholderTextColor: placeholderTextColor, value: text, autoCapitalize: "none", autoCorrect: false, selectionColor: selectionColor, underlineColorAndroid: underlineColorAndroid, onSubmitEditing: _handleSubmit, onChangeText: _handleChangeText, style: [styles.searchInput, searchInputStyle] }),
        react_1.default.createElement(react_native_1.View, { style: { width: 50, alignItems: 'center', justifyContent: 'center' } }, text ? (react_1.default.createElement(react_native_1.TouchableOpacity, { onPress: _handleClear, hitSlop: { top: 15, left: 10, right: 15, bottom: 15 }, style: { padding: 5 } },
            react_1.default.createElement(Ionicons_1.default, { name: "md-close", size: 25, color: tintColor }))) : null)));
}
exports.default = SearchBar;
var styles = react_native_1.StyleSheet.create({
    container: {
        flex: 1,
        flexDirection: 'row',
    },
    searchInput: __assign({ flex: 1, fontSize: 18, marginBottom: 2, paddingLeft: react_native_1.Platform.select({ web: 16, default: 5 }), marginRight: 5 }, react_native_1.Platform.select({
        web: {
            outlineColor: 'transparent',
        },
        default: {},
    })),
});
//# sourceMappingURL=SearchBar.js.map