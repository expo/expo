"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var Ionicons_1 = __importDefault(require("@expo/vector-icons/build/Ionicons"));
var native_1 = require("@react-navigation/native");
var react_1 = __importDefault(require("react"));
var react_native_1 = require("react-native");
var Layout = {
    window: {
        width: react_native_1.Dimensions.get('window').width,
    },
};
var SearchContainerHorizontalMargin = 10;
var SearchContainerWidth = Layout.window.width - SearchContainerHorizontalMargin * 2;
var SearchIcon = function () { return (react_1.default.createElement(react_native_1.View, { style: styles.searchIconContainer },
    react_1.default.createElement(Ionicons_1.default, { name: "ios-search", size: 18, color: "#ccc" }))); };
function SearchBar(_a) {
    var textColor = _a.textColor, cancelButtonText = _a.cancelButtonText, tintColor = _a.tintColor, placeholderTextColor = _a.placeholderTextColor, onChangeQuery = _a.onChangeQuery, onSubmit = _a.onSubmit, onCancelPress = _a.onCancelPress, _b = _a.initialValue, initialValue = _b === void 0 ? '' : _b;
    var navigation = native_1.useNavigation();
    var _c = react_1.default.useState(initialValue), text = _c[0], setText = _c[1];
    var _d = react_1.default.useState(false), showCancelButton = _d[0], setShowCancelButton = _d[1];
    var _e = react_1.default.useState(SearchContainerWidth), inputWidth = _e[0], setInputWidth = _e[1];
    var _textInput = react_1.default.useRef(null);
    react_1.default.useEffect(function () {
        requestAnimationFrame(function () {
            var _a;
            (_a = _textInput.current) === null || _a === void 0 ? void 0 : _a.focus();
        });
    }, []);
    var _handleLayoutCancelButton = function (e) {
        if (showCancelButton) {
            return;
        }
        var cancelButtonWidth = e.nativeEvent.layout.width;
        requestAnimationFrame(function () {
            react_native_1.LayoutAnimation.configureNext({
                duration: 200,
                create: {
                    type: react_native_1.LayoutAnimation.Types.linear,
                    property: react_native_1.LayoutAnimation.Properties.opacity,
                },
                update: {
                    type: react_native_1.LayoutAnimation.Types.spring,
                    springDamping: 0.9,
                    initialVelocity: 10,
                },
            });
            setShowCancelButton(true);
            setInputWidth(SearchContainerWidth - cancelButtonWidth);
        });
    };
    var _handleChangeText = function (text) {
        setText(text);
        onChangeQuery === null || onChangeQuery === void 0 ? void 0 : onChangeQuery(text);
    };
    var _handleSubmit = function () {
        var _a, _b;
        onSubmit === null || onSubmit === void 0 ? void 0 : onSubmit(text);
        (_b = (_a = _textInput.current) === null || _a === void 0 ? void 0 : _a.blur) === null || _b === void 0 ? void 0 : _b.call(_a);
    };
    var _handlePressCancelButton = function () {
        if (onCancelPress) {
            onCancelPress(navigation.goBack);
        }
        else {
            navigation.goBack();
        }
    };
    var searchInputStyle = {};
    if (textColor) {
        searchInputStyle.color = textColor;
    }
    return (react_1.default.createElement(react_native_1.View, { style: styles.container },
        react_1.default.createElement(react_native_1.View, { style: [styles.searchContainer, { width: inputWidth }] },
            react_1.default.createElement(react_native_1.TextInput, { ref: _textInput, clearButtonMode: "while-editing", onChangeText: _handleChangeText, value: text, autoCapitalize: "none", autoCorrect: false, returnKeyType: "search", placeholder: "Search", placeholderTextColor: placeholderTextColor || '#ccc', onSubmitEditing: _handleSubmit, style: [styles.searchInput, searchInputStyle] }),
            react_1.default.createElement(SearchIcon, null)),
        react_1.default.createElement(react_native_1.View, { key: showCancelButton ? 'visible-cancel-button' : 'layout-only-cancel-button', style: [styles.buttonContainer, { opacity: showCancelButton ? 1 : 0 }] },
            react_1.default.createElement(react_native_1.TouchableOpacity, { style: styles.button, hitSlop: { top: 15, bottom: 15, left: 15, right: 20 }, onLayout: _handleLayoutCancelButton, onPress: _handlePressCancelButton },
                react_1.default.createElement(react_native_1.Text, { style: {
                        fontSize: 17,
                        color: tintColor || '#007AFF',
                    } }, cancelButtonText || 'Cancel')))));
}
exports.default = SearchBar;
var styles = react_native_1.StyleSheet.create({
    container: {
        flex: 1,
        flexDirection: 'row',
    },
    buttonContainer: {
        position: 'absolute',
        right: 0,
        top: 0,
        paddingTop: 15,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    button: {
        paddingRight: 17,
        paddingLeft: 2,
    },
    searchContainer: {
        height: 30,
        width: SearchContainerWidth,
        backgroundColor: '#f2f2f2',
        borderRadius: 5,
        marginHorizontal: SearchContainerHorizontalMargin,
        marginTop: 10,
        paddingLeft: 27,
    },
    searchIconContainer: {
        position: 'absolute',
        left: 7,
        top: 6,
        bottom: 0,
    },
    searchInput: {
        flex: 1,
        fontSize: 14,
        paddingTop: 1,
    },
});
//# sourceMappingURL=SearchBar.ios.js.map