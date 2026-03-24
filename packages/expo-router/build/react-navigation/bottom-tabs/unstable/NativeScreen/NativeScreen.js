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
exports.NativeScreen = NativeScreen;
const React = __importStar(require("react"));
const react_native_1 = require("react-native");
const react_native_safe_area_context_1 = require("react-native-safe-area-context");
const react_native_screens_1 = require("react-native-screens");
const elements_1 = require("../../../elements");
const debounce_1 = require("./debounce");
const useAnimatedHeaderHeight_1 = require("./useAnimatedHeaderHeight");
const useHeaderConfig_1 = require("./useHeaderConfig");
const ANDROID_DEFAULT_HEADER_HEIGHT = 56;
function NativeScreen({ route, navigation, options, children }) {
    const { header: renderCustomHeader, headerShown = renderCustomHeader != null, headerTransparent, headerBackground, } = options;
    const isModal = false;
    const insets = (0, react_native_safe_area_context_1.useSafeAreaInsets)();
    // Modals are fullscreen in landscape only on iPhone
    const isIPhone = react_native_1.Platform.OS === 'ios' && !(react_native_1.Platform.isPad || react_native_1.Platform.isTV);
    const isParentHeaderShown = React.useContext(elements_1.HeaderShownContext);
    const parentHeaderHeight = React.useContext(elements_1.HeaderHeightContext);
    const isLandscape = (0, elements_1.useFrameSize)((frame) => frame.width > frame.height);
    const topInset = isParentHeaderShown || (react_native_1.Platform.OS === 'ios' && isModal) || (isIPhone && isLandscape)
        ? 0
        : insets.top;
    const defaultHeaderHeight = (0, elements_1.useFrameSize)((frame) => react_native_1.Platform.select({
        // FIXME: Currently screens isn't using Material 3
        // So our `getDefaultHeaderHeight` doesn't return the correct value
        // So we hardcode the value here for now until screens is updated
        android: ANDROID_DEFAULT_HEADER_HEIGHT + topInset,
        default: (0, elements_1.getDefaultHeaderHeight)(frame, isModal, topInset),
    }));
    const [headerHeight, setHeaderHeight] = React.useState(defaultHeaderHeight);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const setHeaderHeightDebounced = React.useCallback(
    // Debounce the header height updates to avoid excessive re-renders
    (0, debounce_1.debounce)(setHeaderHeight, 100), []);
    const hasCustomHeader = renderCustomHeader != null;
    const animatedHeaderHeight = (0, react_native_1.useAnimatedValue)(defaultHeaderHeight);
    const headerTopInsetEnabled = topInset !== 0;
    const onHeaderHeightChange = react_native_1.Animated.event([
        {
            nativeEvent: {
                headerHeight: animatedHeaderHeight,
            },
        },
    ], {
        useNativeDriver: true,
        listener: (e) => {
            if (hasCustomHeader) {
                // If we have a custom header, don't use native header height
                return;
            }
            if (e.nativeEvent &&
                typeof e.nativeEvent === 'object' &&
                'headerHeight' in e.nativeEvent &&
                typeof e.nativeEvent.headerHeight === 'number') {
                const headerHeight = e.nativeEvent.headerHeight;
                // Only debounce if header has large title or search bar
                // As it's the only case where the header height can change frequently
                const doesHeaderAnimate = react_native_1.Platform.OS === 'ios' &&
                    (options.headerLargeTitleEnabled || options.headerSearchBarOptions);
                if (doesHeaderAnimate) {
                    setHeaderHeightDebounced(headerHeight);
                }
                else {
                    setHeaderHeight(headerHeight);
                }
            }
        },
    });
    const headerConfig = (0, useHeaderConfig_1.useHeaderConfig)({
        ...options,
        route,
        headerHeight,
        headerShown: hasCustomHeader ? false : headerShown === true,
        headerTopInsetEnabled,
    });
    return (<react_native_screens_1.ScreenStack style={styles.container}>
      <react_native_screens_1.ScreenStackItem screenId={route.key} 
    // Needed to show search bar in tab bar with systemItem=search
    stackPresentation="push" headerConfig={headerConfig} onHeaderHeightChange={onHeaderHeightChange}>
        <useAnimatedHeaderHeight_1.AnimatedHeaderHeightContext.Provider value={animatedHeaderHeight}>
          <elements_1.HeaderHeightContext.Provider value={headerShown ? headerHeight : (parentHeaderHeight ?? 0)}>
            {headerBackground != null ? (
        /**
         * To show a custom header background, we render it at the top of the screen below the header
         * The header also needs to be positioned absolutely (with `translucent` style)
         */
        <react_native_1.View style={[
                styles.background,
                headerTransparent ? styles.translucent : null,
                { height: headerHeight },
            ]}>
                {headerBackground()}
              </react_native_1.View>) : null}
            {hasCustomHeader && headerShown ? (<react_native_1.View onLayout={(e) => {
                const headerHeight = e.nativeEvent.layout.height;
                setHeaderHeight(headerHeight);
                animatedHeaderHeight.setValue(headerHeight);
            }} style={[styles.header, headerTransparent ? styles.absolute : null]}>
                {renderCustomHeader?.({
                route,
                navigation,
                options,
            })}
              </react_native_1.View>) : null}
            <elements_1.HeaderShownContext.Provider value={isParentHeaderShown || headerShown}>
              {children}
            </elements_1.HeaderShownContext.Provider>
          </elements_1.HeaderHeightContext.Provider>
        </useAnimatedHeaderHeight_1.AnimatedHeaderHeightContext.Provider>
      </react_native_screens_1.ScreenStackItem>
    </react_native_screens_1.ScreenStack>);
}
const styles = react_native_1.StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        zIndex: 1,
    },
    absolute: {
        position: 'absolute',
        top: 0,
        start: 0,
        end: 0,
    },
    translucent: {
        position: 'absolute',
        top: 0,
        start: 0,
        end: 0,
        zIndex: 1,
        elevation: 1,
    },
    background: {
        overflow: 'hidden',
    },
});
//# sourceMappingURL=NativeScreen.js.map