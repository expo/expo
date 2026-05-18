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
exports.HeaderBackButton = HeaderBackButton;
const jsx_runtime_1 = require("react/jsx-runtime");
const React = __importStar(require("react"));
const react_native_1 = require("react-native");
const HeaderButton_1 = require("./HeaderButton");
const HeaderIcon_1 = require("./HeaderIcon");
const back_icon_mask_png_1 = __importDefault(require("../../../../assets/react-navigation/elements/back-icon-mask.png"));
const back_icon_png_1 = __importDefault(require("../../../../assets/react-navigation/elements/back-icon.png"));
const native_1 = require("../../native");
const MaskedView_1 = require("../MaskedView");
function HeaderBackButton({ disabled, allowFontScaling, backImage, label, labelStyle, displayMode = react_native_1.Platform.OS === 'ios' ? 'default' : 'minimal', onLabelLayout, onPress, pressColor, pressOpacity, screenLayout, tintColor, titleLayout, truncatedLabel = 'Back', accessibilityLabel = label && label !== 'Back' ? `${label}, back` : 'Go back', testID, style, href, }) {
    const { colors, fonts } = (0, native_1.useTheme)();
    const { direction } = (0, native_1.useLocale)();
    const [labelWidth, setLabelWidth] = React.useState(null);
    const [truncatedLabelWidth, setTruncatedLabelWidth] = React.useState(null);
    const renderBackImage = () => {
        if (backImage) {
            return backImage({ tintColor: tintColor ?? colors.text });
        }
        else {
            return ((0, jsx_runtime_1.jsx)(HeaderIcon_1.HeaderIcon, { source: back_icon_png_1.default, tintColor: tintColor, style: [styles.icon, displayMode !== 'minimal' && styles.iconWithLabel] }));
        }
    };
    const renderLabel = () => {
        if (displayMode === 'minimal') {
            return null;
        }
        const availableSpace = titleLayout && screenLayout
            ? (screenLayout.width - titleLayout.width) / 2 - (ICON_WIDTH + HeaderIcon_1.ICON_MARGIN)
            : null;
        const potentialLabelText = displayMode === 'default' ? label : truncatedLabel;
        const finalLabelText = availableSpace && labelWidth && truncatedLabelWidth
            ? availableSpace > labelWidth
                ? potentialLabelText
                : availableSpace > truncatedLabelWidth
                    ? truncatedLabel
                    : null
            : potentialLabelText;
        const commonStyle = [
            fonts.regular,
            styles.label,
            labelStyle,
        ];
        const hiddenStyle = [
            commonStyle,
            {
                position: 'absolute',
                top: 0,
                left: 0,
                opacity: 0,
            },
        ];
        const labelElement = ((0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.labelWrapper, children: [label && displayMode === 'default' ? ((0, jsx_runtime_1.jsx)(react_native_1.Animated.Text, { style: hiddenStyle, numberOfLines: 1, onLayout: (e) => setLabelWidth(e.nativeEvent.layout.width), children: label })) : null, truncatedLabel ? ((0, jsx_runtime_1.jsx)(react_native_1.Animated.Text, { style: hiddenStyle, numberOfLines: 1, onLayout: (e) => setTruncatedLabelWidth(e.nativeEvent.layout.width), children: truncatedLabel })) : null, finalLabelText ? ((0, jsx_runtime_1.jsx)(react_native_1.Animated.Text, { accessible: false, onLayout: onLabelLayout, style: [tintColor ? { color: tintColor } : null, commonStyle], numberOfLines: 1, allowFontScaling: !!allowFontScaling, children: finalLabelText })) : null] }));
        if (backImage || react_native_1.Platform.OS !== 'ios') {
            // When a custom backimage is specified, we can't mask the label
            // Otherwise there might be weird effect due to our mask not being the same as the image
            return labelElement;
        }
        return ((0, jsx_runtime_1.jsx)(MaskedView_1.MaskedView, { maskElement: (0, jsx_runtime_1.jsxs)(react_native_1.View, { style: [
                    styles.iconMaskContainer,
                    // Extend the mask to the center of the screen so that label isn't clipped during animation
                    screenLayout ? { minWidth: screenLayout.width / 2 - 27 } : null,
                ], children: [(0, jsx_runtime_1.jsx)(react_native_1.Image, { source: back_icon_mask_png_1.default, resizeMode: "contain", style: [styles.iconMask, direction === 'rtl' && styles.flip] }), (0, jsx_runtime_1.jsx)(react_native_1.View, { style: styles.iconMaskFillerRect })] }), children: labelElement }));
    };
    const handlePress = () => {
        if (onPress) {
            requestAnimationFrame(() => onPress());
        }
    };
    return ((0, jsx_runtime_1.jsx)(HeaderButton_1.HeaderButton, { disabled: disabled, href: href, accessibilityLabel: accessibilityLabel, testID: testID, onPress: handlePress, pressColor: pressColor, pressOpacity: pressOpacity, style: [styles.container, style], children: (0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [renderBackImage(), renderLabel()] }) }));
}
const ICON_WIDTH = react_native_1.Platform.OS === 'ios' ? 13 : 24;
const ICON_MARGIN_END = react_native_1.Platform.OS === 'ios' ? 22 : 3;
const styles = react_native_1.StyleSheet.create({
    container: {
        paddingHorizontal: 0,
        minWidth: react_native_1.StyleSheet.hairlineWidth, // Avoid collapsing when title is long
        ...react_native_1.Platform.select({
            ios: null,
            default: {
                marginVertical: 3,
                marginHorizontal: 11,
            },
        }),
    },
    label: {
        fontSize: 17,
        // Title and back label are a bit different width due to title being bold
        // Adjusting the letterSpacing makes them coincide better
        letterSpacing: 0.35,
    },
    labelWrapper: {
        // These styles will make sure that the label doesn't fill the available space
        // Otherwise it messes with the measurement of the label
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginEnd: HeaderIcon_1.ICON_MARGIN,
    },
    icon: {
        width: ICON_WIDTH,
        marginEnd: ICON_MARGIN_END,
    },
    iconWithLabel: react_native_1.Platform.OS === 'ios'
        ? {
            marginEnd: 6,
        }
        : {},
    iconMaskContainer: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'center',
    },
    iconMaskFillerRect: {
        flex: 1,
        backgroundColor: '#000',
    },
    iconMask: {
        height: 21,
        width: 13,
        marginStart: -14.5,
        marginVertical: 12,
        alignSelf: 'center',
    },
    flip: {
        transform: 'scaleX(-1)',
    },
});
//# sourceMappingURL=HeaderBackButton.js.map