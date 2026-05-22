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
exports.Header = Header;
const jsx_runtime_1 = require("react/jsx-runtime");
const React = __importStar(require("react"));
const react_1 = require("react");
const react_native_1 = require("react-native");
const react_native_safe_area_context_1 = require("react-native-safe-area-context");
const search_icon_png_1 = __importDefault(require("../../../../assets/react-navigation/elements/search-icon.png"));
const native_1 = require("../../native");
const useFrameSize_1 = require("../useFrameSize");
const HeaderBackButton_1 = require("./HeaderBackButton");
const HeaderBackground_1 = require("./HeaderBackground");
const HeaderButton_1 = require("./HeaderButton");
const HeaderIcon_1 = require("./HeaderIcon");
const HeaderSearchBar_1 = require("./HeaderSearchBar");
const HeaderShownContext_1 = require("./HeaderShownContext");
const HeaderTitle_1 = require("./HeaderTitle");
const getDefaultHeaderHeight_1 = require("./getDefaultHeaderHeight");
const color_1 = require("../../../utils/color");
// Width of the screen in split layout on portrait mode on iPad Mini
const IPAD_MINI_MEDIUM_WIDTH = 414;
const warnIfHeaderStylesDefined = (styles) => {
    Object.keys(styles).forEach((styleProp) => {
        const value = styles[styleProp];
        if (styleProp === 'position' && value === 'absolute') {
            console.warn("position: 'absolute' is not supported on headerStyle. If you would like to render content under the header, use the 'headerTransparent' option.");
        }
        else if (value !== undefined) {
            console.warn(`${styleProp} was given a value of ${value}, this has no effect on headerStyle.`);
        }
    });
};
function Header(props) {
    const insets = (0, react_native_safe_area_context_1.useSafeAreaInsets)();
    const frame = (0, useFrameSize_1.useFrameSize)((size) => size, true);
    const { colors } = (0, native_1.useTheme)();
    const navigation = (0, native_1.useNavigation)();
    const isParentHeaderShown = (0, react_1.use)(HeaderShownContext_1.HeaderShownContext);
    const [searchBarVisible, setSearchBarVisible] = React.useState(false);
    const [titleLayout, setTitleLayout] = React.useState(undefined);
    const onTitleLayout = (e) => {
        const { height, width } = e.nativeEvent.layout;
        setTitleLayout((titleLayout) => {
            if (titleLayout && height === titleLayout.height && width === titleLayout.width) {
                return titleLayout;
            }
            return { height, width };
        });
    };
    const { layout = frame, modal = false, back, title, headerTitle: customTitle, headerTitleAlign = process.env.EXPO_OS === 'ios' ? 'center' : 'left', headerLeft = back ? (props) => (0, jsx_runtime_1.jsx)(HeaderBackButton_1.HeaderBackButton, { ...props }) : undefined, headerSearchBarOptions, headerTransparent, headerTintColor, headerBackground, headerRight, headerTitleAllowFontScaling: titleAllowFontScaling, headerTitleStyle: titleStyle, headerLeftContainerStyle: leftContainerStyle, headerRightContainerStyle: rightContainerStyle, headerTitleContainerStyle: titleContainerStyle, headerBackButtonDisplayMode = process.env.EXPO_OS === 'ios' ? 'default' : 'minimal', headerBackTitleStyle, headerBackgroundContainerStyle: backgroundContainerStyle, headerStyle: customHeaderStyle, headerShadowVisible, headerPressColor, headerPressOpacity, headerStatusBarHeight = isParentHeaderShown ? 0 : insets.top, } = props;
    const defaultHeight = (0, getDefaultHeaderHeight_1.getDefaultHeaderHeight)(layout, modal, headerStatusBarHeight);
    const { height = defaultHeight, maxHeight, minHeight, backfaceVisibility, backgroundColor, borderBlockColor, borderBlockEndColor, borderBlockStartColor, borderBottomColor, borderBottomEndRadius, borderBottomLeftRadius, borderBottomRightRadius, borderBottomStartRadius, borderBottomWidth, borderColor, borderCurve, borderEndColor, borderEndEndRadius, borderEndStartRadius, borderEndWidth, borderLeftColor, borderLeftWidth, borderRadius, borderRightColor, borderRightWidth, borderStartColor, borderStartEndRadius, borderStartStartRadius, borderStartWidth, borderStyle, borderTopColor, borderTopEndRadius, borderTopLeftRadius, borderTopRightRadius, borderTopStartRadius, borderTopWidth, borderWidth, boxShadow, elevation, filter, mixBlendMode, opacity, shadowColor, shadowOffset, shadowOpacity, shadowRadius, transform, transformOrigin, ...unsafeStyles } = react_native_1.StyleSheet.flatten(customHeaderStyle || {});
    if (process.env.NODE_ENV !== 'production') {
        warnIfHeaderStylesDefined(unsafeStyles);
    }
    const safeStyles = {
        backfaceVisibility,
        backgroundColor,
        borderBlockColor,
        borderBlockEndColor,
        borderBlockStartColor,
        borderBottomColor,
        borderBottomEndRadius,
        borderBottomLeftRadius,
        borderBottomRightRadius,
        borderBottomStartRadius,
        borderBottomWidth,
        borderColor,
        borderCurve,
        borderEndColor,
        borderEndEndRadius,
        borderEndStartRadius,
        borderEndWidth,
        borderLeftColor,
        borderLeftWidth,
        borderRadius,
        borderRightColor,
        borderRightWidth,
        borderStartColor,
        borderStartEndRadius,
        borderStartStartRadius,
        borderStartWidth,
        borderStyle,
        borderTopColor,
        borderTopEndRadius,
        borderTopLeftRadius,
        borderTopRightRadius,
        borderTopStartRadius,
        borderTopWidth,
        borderWidth,
        boxShadow,
        elevation,
        filter,
        mixBlendMode,
        opacity,
        shadowColor,
        shadowOffset,
        shadowOpacity,
        shadowRadius,
        transform,
        transformOrigin,
    };
    // Setting a property to undefined triggers default style
    // So we need to filter them out
    // Users can use `null` instead
    for (const styleProp in safeStyles) {
        // @ts-expect-error: typescript wrongly complains that styleProp cannot be used to index safeStyles
        if (safeStyles[styleProp] === undefined) {
            // @ts-expect-error don't need to care about index signature for deletion
            // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
            delete safeStyles[styleProp];
        }
    }
    const backgroundStyle = {
        ...(headerTransparent && { backgroundColor: 'transparent' }),
        ...((headerTransparent || headerShadowVisible === false) && {
            borderBottomWidth: 0,
            ...react_native_1.Platform.select({
                android: {
                    elevation: 0,
                },
                web: {
                    boxShadow: 'none',
                },
                default: {
                    shadowOpacity: 0,
                },
            }),
        }),
        ...safeStyles,
    };
    const iconTintColor = headerTintColor ??
        react_native_1.Platform.select({
            ios: colors.primary,
            default: colors.text,
        });
    const leftButton = headerLeft
        ? headerLeft({
            tintColor: iconTintColor,
            pressColor: headerPressColor,
            pressOpacity: headerPressOpacity,
            displayMode: headerBackButtonDisplayMode,
            titleLayout,
            screenLayout: layout,
            canGoBack: Boolean(back),
            onPress: back ? navigation.goBack : undefined,
            label: back?.title,
            labelStyle: headerBackTitleStyle,
            href: back?.href,
        })
        : null;
    const rightButton = headerRight
        ? headerRight({
            tintColor: iconTintColor,
            pressColor: headerPressColor,
            pressOpacity: headerPressOpacity,
            canGoBack: Boolean(back),
        })
        : null;
    const headerTitle = typeof customTitle !== 'function'
        ? (props) => (0, jsx_runtime_1.jsx)(HeaderTitle_1.HeaderTitle, { ...props })
        : customTitle;
    return ((0, jsx_runtime_1.jsxs)(react_native_1.Animated.View, { style: [styles.boxNone, { height, minHeight, maxHeight, opacity, transform }], children: [(0, jsx_runtime_1.jsx)(react_native_1.Animated.View, { style: [react_native_1.StyleSheet.absoluteFill, styles.boxNone, backgroundContainerStyle], children: headerBackground ? (headerBackground({ style: backgroundStyle })) : ((0, jsx_runtime_1.jsx)(HeaderBackground_1.HeaderBackground, { style: [
                        {
                            // Allow touch through the header when background color is transparent
                            pointerEvents: headerTransparent &&
                                (backgroundStyle.backgroundColor === 'transparent' ||
                                    (backgroundStyle.backgroundColor &&
                                        (0, color_1.Color)(backgroundStyle.backgroundColor)?.alpha() === 0))
                                ? 'none'
                                : 'auto',
                        },
                        backgroundStyle,
                    ] })) }), (0, jsx_runtime_1.jsx)(react_native_1.View, { style: [styles.pointerEventsNone, { height: headerStatusBarHeight }] }), (0, jsx_runtime_1.jsxs)(react_native_1.View, { style: [
                    styles.content,
                    process.env.EXPO_OS === 'ios' && frame.width >= IPAD_MINI_MEDIUM_WIDTH
                        ? styles.large
                        : null,
                ], children: [(0, jsx_runtime_1.jsx)(react_native_1.Animated.View, { style: [
                            styles.start,
                            !searchBarVisible && headerTitleAlign === 'center' && styles.expand,
                            { marginStart: insets.left },
                            leftContainerStyle,
                        ], children: leftButton }), process.env.EXPO_OS === 'ios' || !searchBarVisible ? ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)(react_native_1.Animated.View, { style: [
                                    styles.title,
                                    {
                                        // Avoid the title from going offscreen or overlapping buttons
                                        maxWidth: headerTitleAlign === 'center'
                                            ? layout.width -
                                                ((leftButton ? (headerBackButtonDisplayMode !== 'minimal' ? 80 : 32) : 16) +
                                                    (rightButton || headerSearchBarOptions ? 16 : 0) +
                                                    Math.max(insets.left, insets.right)) *
                                                    2
                                            : layout.width -
                                                ((leftButton ? 52 : 16) +
                                                    (rightButton || headerSearchBarOptions ? 52 : 16) +
                                                    insets.left -
                                                    insets.right),
                                    },
                                    headerTitleAlign === 'left' && leftButton
                                        ? { marginStart: 4 }
                                        : { marginHorizontal: 16 },
                                    titleContainerStyle,
                                ], children: headerTitle({
                                    children: title,
                                    allowFontScaling: titleAllowFontScaling,
                                    tintColor: headerTintColor,
                                    onLayout: onTitleLayout,
                                    style: titleStyle,
                                }) }), (0, jsx_runtime_1.jsxs)(react_native_1.Animated.View, { style: [styles.end, styles.expand, { marginEnd: insets.right }, rightContainerStyle], children: [rightButton, headerSearchBarOptions ? ((0, jsx_runtime_1.jsx)(HeaderButton_1.HeaderButton, { tintColor: iconTintColor, pressColor: headerPressColor, pressOpacity: headerPressOpacity, onPress: () => {
                                            setSearchBarVisible(true);
                                            headerSearchBarOptions?.onOpen?.();
                                        }, children: (0, jsx_runtime_1.jsx)(HeaderIcon_1.HeaderIcon, { source: search_icon_png_1.default, tintColor: iconTintColor }) })) : null] })] })) : null, process.env.EXPO_OS === 'ios' || searchBarVisible ? ((0, jsx_runtime_1.jsx)(HeaderSearchBar_1.HeaderSearchBar, { ...headerSearchBarOptions, visible: searchBarVisible, onClose: () => {
                            setSearchBarVisible(false);
                            headerSearchBarOptions?.onClose?.();
                        }, tintColor: headerTintColor, style: [
                            process.env.EXPO_OS === 'ios'
                                ? [
                                    react_native_1.StyleSheet.absoluteFill,
                                    { paddingTop: headerStatusBarHeight ? 0 : 4 },
                                    { backgroundColor: backgroundColor ?? colors.card },
                                ]
                                : !leftButton && { marginStart: 8 },
                        ] })) : null] })] }));
}
const styles = react_native_1.StyleSheet.create({
    content: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'stretch',
        pointerEvents: 'box-none',
    },
    large: {
        marginHorizontal: 5,
    },
    title: {
        pointerEvents: 'box-none',
        justifyContent: 'center',
    },
    start: {
        pointerEvents: 'box-none',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-start',
    },
    end: {
        pointerEvents: 'box-none',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
    },
    expand: {
        flexGrow: 1,
        flexBasis: 0,
    },
    boxNone: {
        pointerEvents: 'box-none',
    },
    pointerEventsNone: {
        pointerEvents: 'none',
    },
});
//# sourceMappingURL=Header.js.map