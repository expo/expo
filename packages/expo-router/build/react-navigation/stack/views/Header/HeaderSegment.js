"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.HeaderSegment = HeaderSegment;
const React = __importStar(require("react"));
const react_native_1 = require("react-native");
const elements_1 = require("../../../elements");
const native_1 = require("../../../native");
function HeaderSegment(props) {
    const { direction } = (0, native_1.useLocale)();
    const [leftLabelLayout, setLeftLabelLayout] = React.useState(undefined);
    const [titleLayout, setTitleLayout] = React.useState(undefined);
    const handleTitleLayout = (e) => {
        const { height, width } = e.nativeEvent.layout;
        setTitleLayout((titleLayout) => {
            if (titleLayout && height === titleLayout.height && width === titleLayout.width) {
                return titleLayout;
            }
            return { height, width };
        });
    };
    const handleLeftLabelLayout = (e) => {
        const { height, width } = e.nativeEvent.layout;
        if (leftLabelLayout && height === leftLabelLayout.height && width === leftLabelLayout.width) {
            return;
        }
        setLeftLabelLayout({ height, width });
    };
    const { progress, layout, modal, onGoBack, backHref, headerTitle: title, headerLeft: left = onGoBack
        ? (props) => <elements_1.HeaderBackButton {...props}/>
        : undefined, headerRight: right, headerBackImage, headerBackTitle, headerBackButtonDisplayMode = react_native_1.Platform.OS === 'ios' ? 'default' : 'minimal', headerBackTruncatedTitle, headerBackAccessibilityLabel, headerBackTestID, headerBackAllowFontScaling, headerBackTitleStyle, headerTitleContainerStyle, headerLeftContainerStyle, headerRightContainerStyle, headerBackgroundContainerStyle, headerStyle: customHeaderStyle, headerStatusBarHeight, styleInterpolator, ...rest } = props;
    const defaultHeight = (0, elements_1.getDefaultHeaderHeight)(layout, modal, headerStatusBarHeight);
    const { height = defaultHeight } = react_native_1.StyleSheet.flatten(customHeaderStyle || {});
    const headerHeight = typeof height === 'number' ? height : defaultHeight;
    const { titleStyle, leftButtonStyle, leftLabelStyle, rightButtonStyle, backgroundStyle } = React.useMemo(() => styleInterpolator({
        current: { progress: progress.current },
        next: progress.next && { progress: progress.next },
        direction,
        layouts: {
            header: {
                height: headerHeight,
                width: layout.width,
            },
            screen: layout,
            title: titleLayout,
            leftLabel: leftLabelLayout,
        },
    }), [styleInterpolator, progress, direction, headerHeight, layout, titleLayout, leftLabelLayout]);
    const headerLeft = left
        ? (props) => left({
            ...props,
            href: backHref,
            backImage: headerBackImage,
            accessibilityLabel: headerBackAccessibilityLabel,
            testID: headerBackTestID,
            allowFontScaling: headerBackAllowFontScaling,
            onPress: onGoBack,
            label: headerBackTitle,
            truncatedLabel: headerBackTruncatedTitle,
            labelStyle: [leftLabelStyle, headerBackTitleStyle],
            onLabelLayout: handleLeftLabelLayout,
            screenLayout: layout,
            titleLayout,
            canGoBack: Boolean(onGoBack),
        })
        : undefined;
    const headerRight = right
        ? (props) => right({
            ...props,
            canGoBack: Boolean(onGoBack),
        })
        : undefined;
    const headerTitle = typeof title !== 'function'
        ? (props) => <elements_1.HeaderTitle {...props} onLayout={handleTitleLayout}/>
        : (props) => title({ ...props, onLayout: handleTitleLayout });
    return (<elements_1.Header modal={modal} layout={layout} headerTitle={headerTitle} headerLeft={headerLeft} headerRight={headerRight} headerTitleContainerStyle={[titleStyle, headerTitleContainerStyle]} headerLeftContainerStyle={[leftButtonStyle, headerLeftContainerStyle]} headerRightContainerStyle={[rightButtonStyle, headerRightContainerStyle]} headerBackButtonDisplayMode={headerBackButtonDisplayMode} headerBackgroundContainerStyle={[backgroundStyle, headerBackgroundContainerStyle]} headerStyle={customHeaderStyle} headerStatusBarHeight={headerStatusBarHeight} {...rest}/>);
}
//# sourceMappingURL=HeaderSegment.js.map