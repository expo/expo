"use strict";
'use client';
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
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HeaderSearchBar = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const React = __importStar(require("react"));
const react_native_1 = require("react-native");
const clear_icon_png_1 = __importDefault(require("../../../../assets/react-navigation/elements/clear-icon.png"));
const close_icon_png_1 = __importDefault(require("../../../../assets/react-navigation/elements/close-icon.png"));
const search_icon_png_1 = __importDefault(require("../../../../assets/react-navigation/elements/search-icon.png"));
const color_1 = require("../../../utils/color");
const PlatformPressable_1 = require("../PlatformPressable");
const Text_1 = require("../Text");
const HeaderButton_1 = require("./HeaderButton");
const HeaderIcon_1 = require("./HeaderIcon");
const native_1 = require("../../native");
const INPUT_TYPE_TO_MODE = {
    text: 'text',
    number: 'numeric',
    phone: 'tel',
    email: 'email',
};
const useNativeDriver = react_native_1.Platform.OS !== 'web';
function HeaderSearchBarInternal({ ref, visible, inputType, autoFocus = true, autoCapitalize, placeholder = 'Search', cancelButtonText = 'Cancel', enterKeyHint = 'search', onChangeText, onClose, tintColor, style, ...rest }) {
    const navigation = (0, native_1.useNavigation)();
    const { dark, colors, fonts } = (0, native_1.useTheme)();
    const [value, setValue] = React.useState('');
    const [rendered, setRendered] = React.useState(visible);
    const [visibleAnim] = React.useState(() => new react_native_1.Animated.Value(visible ? 1 : 0));
    const [clearVisibleAnim] = React.useState(() => new react_native_1.Animated.Value(0));
    const visibleValueRef = React.useRef(visible);
    const clearVisibleValueRef = React.useRef(false);
    const inputRef = React.useRef(null);
    React.useEffect(() => {
        // Avoid act warning in tests just by rendering header
        if (visible === visibleValueRef.current) {
            return;
        }
        react_native_1.Animated.timing(visibleAnim, {
            toValue: visible ? 1 : 0,
            duration: 100,
            useNativeDriver,
        }).start(({ finished }) => {
            if (finished) {
                setRendered(visible);
                visibleValueRef.current = visible;
            }
        });
        return () => {
            visibleAnim.stopAnimation();
        };
    }, [visible, visibleAnim]);
    const hasText = value !== '';
    React.useEffect(() => {
        if (clearVisibleValueRef.current === hasText) {
            return;
        }
        react_native_1.Animated.timing(clearVisibleAnim, {
            toValue: hasText ? 1 : 0,
            duration: 100,
            useNativeDriver,
        }).start(({ finished }) => {
            if (finished) {
                clearVisibleValueRef.current = hasText;
            }
        });
    }, [clearVisibleAnim, hasText]);
    const clearText = React.useCallback(() => {
        inputRef.current?.clear();
        inputRef.current?.focus();
        setValue('');
    }, []);
    const onClear = React.useCallback(() => {
        clearText();
        // FIXME: figure out how to create a SyntheticEvent
        // @ts-expect-error: we don't have the native event here
        onChangeText?.({ nativeEvent: { text: '' } });
    }, [clearText, onChangeText]);
    const cancelSearch = React.useCallback(() => {
        onClear();
        onClose();
    }, [onClear, onClose]);
    React.useEffect(() => navigation?.addListener('blur', cancelSearch), [cancelSearch, navigation]);
    React.useImperativeHandle(ref, () => ({
        focus: () => {
            inputRef.current?.focus();
        },
        blur: () => {
            inputRef.current?.blur();
        },
        setText: (text) => {
            inputRef.current?.setNativeProps({ text });
            setValue(text);
        },
        clearText,
        cancelSearch,
    }), [cancelSearch, clearText]);
    if (!visible && !rendered) {
        return null;
    }
    const textColor = tintColor ?? colors.text;
    return ((0, jsx_runtime_1.jsxs)(react_native_1.Animated.View, { "aria-live": "polite", "aria-hidden": !visible, style: [
            styles.container,
            { pointerEvents: visible ? 'auto' : 'none', opacity: visibleAnim },
            style,
        ], children: [(0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.searchbarContainer, children: [(0, jsx_runtime_1.jsx)(HeaderIcon_1.HeaderIcon, { source: search_icon_png_1.default, tintColor: textColor, style: styles.inputSearchIcon }), (0, jsx_runtime_1.jsx)(react_native_1.TextInput, { ...rest, ref: inputRef, onChange: onChangeText, onChangeText: setValue, autoFocus: autoFocus, autoCapitalize: autoCapitalize === 'systemDefault' ? undefined : autoCapitalize, inputMode: INPUT_TYPE_TO_MODE[inputType ?? 'text'], enterKeyHint: enterKeyHint, placeholder: placeholder, placeholderTextColor: (0, color_1.Color)(textColor)?.alpha(0.5).string(), cursorColor: colors.primary, selectionHandleColor: colors.primary, selectionColor: (0, color_1.Color)(colors.primary)?.alpha(0.3).string(), style: [
                            fonts.regular,
                            styles.searchbar,
                            {
                                backgroundColor: react_native_1.Platform.select({
                                    ios: dark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                                    default: 'transparent',
                                }),
                                color: textColor,
                                borderBottomColor: (0, color_1.Color)(textColor)?.alpha(0.2).string() ??
                                    (dark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)'),
                            },
                        ] }), react_native_1.Platform.OS === 'ios' ? ((0, jsx_runtime_1.jsx)(PlatformPressable_1.PlatformPressable, { onPress: onClear, style: [
                            {
                                opacity: clearVisibleAnim,
                                transform: [{ scale: clearVisibleAnim }],
                            },
                            styles.clearButton,
                        ], children: (0, jsx_runtime_1.jsx)(react_native_1.Image, { source: clear_icon_png_1.default, resizeMode: "contain", tintColor: textColor, style: styles.clearIcon }) })) : null] }), react_native_1.Platform.OS !== 'ios' ? ((0, jsx_runtime_1.jsx)(HeaderButton_1.HeaderButton, { onPress: () => {
                    if (value) {
                        onClear();
                    }
                    else {
                        onClose();
                    }
                }, style: styles.closeButton, children: (0, jsx_runtime_1.jsx)(HeaderIcon_1.HeaderIcon, { source: close_icon_png_1.default, tintColor: textColor }) })) : null, react_native_1.Platform.OS === 'ios' ? ((0, jsx_runtime_1.jsx)(PlatformPressable_1.PlatformPressable, { onPress: cancelSearch, style: styles.cancelButton, children: (0, jsx_runtime_1.jsx)(Text_1.Text, { style: [fonts.regular, { color: tintColor ?? colors.primary }, styles.cancelText], children: cancelButtonText }) })) : null] }));
}
const styles = react_native_1.StyleSheet.create({
    container: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'stretch',
    },
    inputSearchIcon: {
        position: 'absolute',
        opacity: 0.5,
        left: react_native_1.Platform.select({ ios: 16, default: 4 }),
        top: react_native_1.Platform.select({ ios: -1, default: 17 }),
        ...react_native_1.Platform.select({
            ios: {
                height: 18,
                width: 18,
            },
            default: {},
        }),
    },
    closeButton: {
        position: 'absolute',
        opacity: 0.5,
        right: react_native_1.Platform.select({ ios: 0, default: 8 }),
        top: react_native_1.Platform.select({ ios: -2, default: 17 }),
    },
    clearButton: {
        position: 'absolute',
        right: 0,
        top: -7,
        bottom: 0,
        justifyContent: 'center',
        padding: 8,
    },
    clearIcon: {
        height: 16,
        width: 16,
        opacity: 0.5,
    },
    cancelButton: {
        alignSelf: 'center',
        top: -4,
    },
    cancelText: {
        fontSize: 17,
        marginHorizontal: 12,
    },
    searchbarContainer: {
        flex: 1,
    },
    searchbar: react_native_1.Platform.select({
        ios: {
            flex: 1,
            fontSize: 17,
            paddingHorizontal: 32,
            marginLeft: 16,
            marginTop: -1,
            marginBottom: 4,
            borderRadius: 8,
            borderCurve: 'continuous',
        },
        default: {
            flex: 1,
            fontSize: 18,
            paddingHorizontal: 36,
            marginRight: 8,
            marginTop: 8,
            marginBottom: 8,
            borderBottomWidth: 1,
        },
    }),
});
exports.HeaderSearchBar = HeaderSearchBarInternal;
//# sourceMappingURL=HeaderSearchBar.js.map