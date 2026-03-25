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
exports.NativeStackView = NativeStackView;
const React = __importStar(require("react"));
const react_native_1 = require("react-native");
const react_native_safe_area_context_1 = require("react-native-safe-area-context");
const react_native_screens_1 = require("react-native-screens");
const elements_1 = require("../../elements");
const useHeaderConfigProps_1 = require("./useHeaderConfigProps");
const native_1 = require("../../native");
const debounce_1 = require("../utils/debounce");
const getModalRoutesKeys_1 = require("../utils/getModalRoutesKeys");
const useAnimatedHeaderHeight_1 = require("../utils/useAnimatedHeaderHeight");
const useDismissedRouteError_1 = require("../utils/useDismissedRouteError");
const useInvalidPreventRemoveError_1 = require("../utils/useInvalidPreventRemoveError");
const ANDROID_DEFAULT_HEADER_HEIGHT = 56;
function isFabric() {
    return 'nativeFabricUIManager' in global;
}
const useNativeDriver = react_native_1.Platform.OS !== 'web';
const SceneView = ({ index, focused, shouldFreeze, descriptor, previousDescriptor, nextDescriptor, isPresentationModal, isPreloaded, onWillDisappear, onWillAppear, onAppear, onDisappear, onDismissed, onHeaderBackButtonClicked, onNativeDismissCancelled, onGestureCancel, onSheetDetentChanged, }) => {
    const { route, navigation, options, render } = descriptor;
    let { animation, animationMatchesGesture, presentation = isPresentationModal ? 'modal' : 'card', fullScreenGestureEnabled, } = options;
    const { animationDuration, animationTypeForReplace = 'push', fullScreenGestureShadowEnabled = true, gestureEnabled, gestureDirection = presentation === 'card' ? 'horizontal' : 'vertical', gestureResponseDistance, header, headerBackButtonMenuEnabled, headerShown, headerBackground, headerTransparent, autoHideHomeIndicator, keyboardHandlingEnabled, navigationBarColor, navigationBarTranslucent, navigationBarHidden, orientation, sheetAllowedDetents = [1.0], sheetLargestUndimmedDetentIndex = -1, sheetGrabberVisible = false, sheetCornerRadius = -1.0, sheetElevation = 24, sheetExpandsWhenScrolledToEdge = true, sheetInitialDetentIndex = 0, sheetShouldOverflowTopInset = false, sheetResizeAnimationEnabled = true, statusBarAnimation, statusBarHidden, statusBarStyle, statusBarTranslucent, statusBarBackgroundColor, unstable_sheetFooter, scrollEdgeEffects, freezeOnBlur, contentStyle, } = options;
    if (gestureDirection === 'vertical' && react_native_1.Platform.OS === 'ios') {
        // for `vertical` direction to work, we need to set `fullScreenGestureEnabled` to `true`
        // so the screen can be dismissed from any point on screen.
        // `animationMatchesGesture` needs to be set to `true` so the `animation` set by user can be used,
        // otherwise `simple_push` will be used.
        // Also, the default animation for this direction seems to be `slide_from_bottom`.
        if (fullScreenGestureEnabled === undefined) {
            fullScreenGestureEnabled = true;
        }
        if (animationMatchesGesture === undefined) {
            animationMatchesGesture = true;
        }
        if (animation === undefined) {
            animation = 'slide_from_bottom';
        }
    }
    // workaround for rn-screens where gestureDirection has to be set on both
    // current and previous screen - software-mansion/react-native-screens/pull/1509
    const nextGestureDirection = nextDescriptor?.options.gestureDirection;
    const gestureDirectionOverride = nextGestureDirection != null ? nextGestureDirection : gestureDirection;
    if (index === 0) {
        // first screen should always be treated as `card`, it resolves problems with no header animation
        // for navigator with first screen as `modal` and the next as `card`
        presentation = 'card';
    }
    const { colors } = (0, native_1.useTheme)();
    const insets = (0, react_native_safe_area_context_1.useSafeAreaInsets)();
    // `modal`, `formSheet` and `pageSheet` presentations do not take whole screen, so should not take the inset.
    const isModal = presentation === 'modal' || presentation === 'formSheet' || presentation === 'pageSheet';
    // Modals are fullscreen in landscape only on iPhone
    const isIPhone = react_native_1.Platform.OS === 'ios' && !(react_native_1.Platform.isPad || react_native_1.Platform.isTV);
    const isParentHeaderShown = React.useContext(elements_1.HeaderShownContext);
    const parentHeaderHeight = React.useContext(elements_1.HeaderHeightContext);
    const parentHeaderBack = React.useContext(elements_1.HeaderBackContext);
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
    const { preventedRoutes } = (0, native_1.usePreventRemoveContext)();
    const [headerHeight, setHeaderHeight] = React.useState(defaultHeaderHeight);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const setHeaderHeightDebounced = React.useCallback(
    // Debounce the header height updates to avoid excessive re-renders
    (0, debounce_1.debounce)(setHeaderHeight, 100), []);
    const hasCustomHeader = header != null;
    const usesNewAndroidHeaderHeightImplementation = 'usesNewAndroidHeaderHeightImplementation' in react_native_screens_1.compatibilityFlags &&
        react_native_screens_1.compatibilityFlags['usesNewAndroidHeaderHeightImplementation'] === true;
    let headerHeightCorrectionOffset = 0;
    if (react_native_1.Platform.OS === 'android' && !hasCustomHeader && !usesNewAndroidHeaderHeightImplementation) {
        const statusBarHeight = react_native_1.StatusBar.currentHeight ?? 0;
        // On Android, the native header height is not correctly calculated
        // It includes status bar height even if statusbar is not translucent
        // And the statusbar value itself doesn't match the actual status bar height
        // So we subtract the bogus status bar height and add the actual top inset
        headerHeightCorrectionOffset = -statusBarHeight + topInset;
    }
    const rawAnimatedHeaderHeight = (0, react_native_1.useAnimatedValue)(defaultHeaderHeight);
    const animatedHeaderHeight = React.useMemo(() => react_native_1.Animated.add(rawAnimatedHeaderHeight, headerHeightCorrectionOffset), [headerHeightCorrectionOffset, rawAnimatedHeaderHeight]);
    // During the very first render topInset is > 0 when running
    // in non edge-to-edge mode on Android, while on every consecutive render
    // topInset === 0, causing header content to jump, as we add padding on the first frame,
    // just to remove it in next one. To prevent this, when statusBarTranslucent is set,
    // we apply additional padding in header only if its true.
    // For more details see: https://github.com/react-navigation/react-navigation/pull/12014
    const headerTopInsetEnabled = typeof statusBarTranslucent === 'boolean' ? statusBarTranslucent : topInset !== 0;
    const canGoBack = previousDescriptor != null || parentHeaderBack != null;
    const backTitle = previousDescriptor
        ? (0, elements_1.getHeaderTitle)(previousDescriptor.options, previousDescriptor.route.name)
        : parentHeaderBack?.title;
    const headerBack = React.useMemo(() => {
        if (canGoBack) {
            return {
                href: undefined, // No href needed for native
                title: backTitle,
            };
        }
        return undefined;
    }, [canGoBack, backTitle]);
    const isRemovePrevented = preventedRoutes[route.key]?.preventRemove;
    const headerConfig = (0, useHeaderConfigProps_1.useHeaderConfigProps)({
        ...options,
        route,
        headerBackButtonMenuEnabled: isRemovePrevented !== undefined ? !isRemovePrevented : headerBackButtonMenuEnabled,
        headerBackTitle: options.headerBackTitle !== undefined ? options.headerBackTitle : undefined,
        headerHeight,
        headerShown: header !== undefined ? false : headerShown,
        headerTopInsetEnabled,
        headerTransparent,
        headerBack,
    });
    const onHeaderHeightChange = hasCustomHeader
        ? // If we have a custom header, don't use native header height
            undefined
        : // On Fabric, there's a bug where native event drivers for Animated objects
            // are created after the first notifications about the header height
            // from the native side, `onHeaderHeightChange` event does not notify
            // `animatedHeaderHeight` about initial values on appearing screens at the moment.
            react_native_1.Animated.event([
                {
                    nativeEvent: {
                        headerHeight: rawAnimatedHeaderHeight,
                    },
                },
            ], {
                useNativeDriver,
                listener: (e) => {
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
                            if (react_native_1.Platform.OS === 'android' &&
                                headerHeight !== 0 &&
                                // On some devices, height maybe slightly off (e.g. 56.17 instead of 56)
                                Math.round(headerHeight) <= ANDROID_DEFAULT_HEADER_HEIGHT) {
                                // FIXME: On Android, events may get delivered out-of-order
                                // https://github.com/facebook/react-native/issues/54636
                                // We seem to get header height without status bar height first,
                                // and then the correct height with status bar height included
                                // But due to out-of-order delivery, we may get the correct height first
                                // and then the one without status bar height
                                // This is hack to include status bar height if it's not already included
                                // It only works because header height doesn't change dynamically on Android
                                setHeaderHeight(headerHeight + insets.top);
                            }
                            else {
                                setHeaderHeight(headerHeight);
                            }
                        }
                    }
                },
            });
    return (<native_1.NavigationProvider route={route} navigation={navigation}>
      <react_native_screens_1.ScreenStackItem screenId={route.key} activityState={isPreloaded ? 0 : 2} style={react_native_1.StyleSheet.absoluteFill} aria-hidden={!focused} customAnimationOnSwipe={animationMatchesGesture} fullScreenSwipeEnabled={fullScreenGestureEnabled} fullScreenSwipeShadowEnabled={fullScreenGestureShadowEnabled} freezeOnBlur={freezeOnBlur} gestureEnabled={react_native_1.Platform.OS === 'android'
            ? // This prop enables handling of system back gestures on Android
                // Since we handle them in JS side, we disable this
                false
            : gestureEnabled} homeIndicatorHidden={autoHideHomeIndicator} hideKeyboardOnSwipe={keyboardHandlingEnabled} navigationBarColor={navigationBarColor} navigationBarTranslucent={navigationBarTranslucent} navigationBarHidden={navigationBarHidden} replaceAnimation={animationTypeForReplace} stackPresentation={presentation === 'card' ? 'push' : presentation} stackAnimation={animation} screenOrientation={orientation} sheetAllowedDetents={sheetAllowedDetents} sheetLargestUndimmedDetentIndex={sheetLargestUndimmedDetentIndex} sheetGrabberVisible={sheetGrabberVisible} sheetInitialDetentIndex={sheetInitialDetentIndex} sheetCornerRadius={sheetCornerRadius} sheetElevation={sheetElevation} sheetExpandsWhenScrolledToEdge={sheetExpandsWhenScrolledToEdge} sheetShouldOverflowTopInset={sheetShouldOverflowTopInset} sheetDefaultResizeAnimationEnabled={sheetResizeAnimationEnabled} statusBarAnimation={statusBarAnimation} statusBarHidden={statusBarHidden} statusBarStyle={statusBarStyle} statusBarColor={statusBarBackgroundColor} statusBarTranslucent={statusBarTranslucent} swipeDirection={gestureDirectionOverride} transitionDuration={animationDuration} onWillAppear={onWillAppear} onWillDisappear={onWillDisappear} onAppear={onAppear} onDisappear={onDisappear} onDismissed={onDismissed} onGestureCancel={onGestureCancel} onSheetDetentChanged={onSheetDetentChanged} gestureResponseDistance={gestureResponseDistance} nativeBackButtonDismissalEnabled={false} // on Android
     onHeaderBackButtonClicked={onHeaderBackButtonClicked} preventNativeDismiss={isRemovePrevented} // on iOS
     scrollEdgeEffects={{
            bottom: scrollEdgeEffects?.bottom ?? 'automatic',
            top: scrollEdgeEffects?.top ?? 'automatic',
            left: scrollEdgeEffects?.left ?? 'automatic',
            right: scrollEdgeEffects?.right ?? 'automatic',
        }} onNativeDismissCancelled={onNativeDismissCancelled} onHeaderHeightChange={onHeaderHeightChange} contentStyle={[
            presentation !== 'transparentModal' &&
                presentation !== 'containedTransparentModal' && {
                backgroundColor: colors.background,
            },
            contentStyle,
        ]} headerConfig={headerConfig} unstable_sheetFooter={unstable_sheetFooter} 
    // When ts-expect-error is added, it affects all the props below it
    // So we keep any props that need it at the end
    // Otherwise invalid props may not be caught by TypeScript
    shouldFreeze={shouldFreeze}>
        <useAnimatedHeaderHeight_1.AnimatedHeaderHeightContext.Provider value={animatedHeaderHeight}>
          <elements_1.HeaderHeightContext.Provider value={headerShown !== false ? headerHeight : (parentHeaderHeight ?? 0)}>
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
            {header != null && headerShown !== false ? (<react_native_1.View onLayout={(e) => {
                const headerHeight = e.nativeEvent.layout.height;
                setHeaderHeight(headerHeight);
                rawAnimatedHeaderHeight.setValue(headerHeight);
            }} style={[styles.header, headerTransparent ? styles.absolute : null]}>
                {header({
                back: headerBack,
                options,
                route,
                navigation,
            })}
              </react_native_1.View>) : null}
            <elements_1.HeaderShownContext.Provider value={isParentHeaderShown || headerShown !== false}>
              <elements_1.HeaderBackContext.Provider value={headerBack}>{render()}</elements_1.HeaderBackContext.Provider>
            </elements_1.HeaderShownContext.Provider>
          </elements_1.HeaderHeightContext.Provider>
        </useAnimatedHeaderHeight_1.AnimatedHeaderHeightContext.Provider>
      </react_native_screens_1.ScreenStackItem>
    </native_1.NavigationProvider>);
};
function NativeStackView({ state, navigation, descriptors, describe }) {
    const { setNextDismissedKey } = (0, useDismissedRouteError_1.useDismissedRouteError)(state);
    (0, useInvalidPreventRemoveError_1.useInvalidPreventRemoveError)(descriptors);
    const modalRouteKeys = (0, getModalRoutesKeys_1.getModalRouteKeys)(state.routes, descriptors);
    const preloadedDescriptors = state.preloadedRoutes.reduce((acc, route) => {
        acc[route.key] = acc[route.key] || describe(route, true);
        return acc;
    }, {});
    return (<elements_1.SafeAreaProviderCompat>
      <react_native_screens_1.ScreenStack style={styles.container}>
        {state.routes.concat(state.preloadedRoutes).map((route, index) => {
            const descriptor = descriptors[route.key] ?? preloadedDescriptors[route.key];
            const isFocused = state.index === index;
            const isBelowFocused = state.index - 1 === index;
            const previousKey = state.routes[index - 1]?.key;
            const nextKey = state.routes[index + 1]?.key;
            const previousDescriptor = previousKey ? descriptors[previousKey] : undefined;
            const nextDescriptor = nextKey ? descriptors[nextKey] : undefined;
            const isModal = modalRouteKeys.includes(route.key);
            const isModalOnIos = isModal && react_native_1.Platform.OS === 'ios';
            const isPreloaded = preloadedDescriptors[route.key] !== undefined && descriptors[route.key] === undefined;
            // On Fabric, when screen is frozen, animated and reanimated values are not updated
            // due to component being unmounted. To avoid this, we don't freeze the previous screen there
            const shouldFreeze = isFabric()
                ? !isPreloaded && !isFocused && !isBelowFocused && !isModalOnIos
                : !isPreloaded && !isFocused && !isModalOnIos;
            return (<SceneView key={route.key} index={index} focused={isFocused} shouldFreeze={shouldFreeze} descriptor={descriptor} previousDescriptor={previousDescriptor} nextDescriptor={nextDescriptor} isPresentationModal={isModal} isPreloaded={isPreloaded} onWillDisappear={() => {
                    navigation.emit({
                        type: 'transitionStart',
                        data: { closing: true },
                        target: route.key,
                    });
                }} onWillAppear={() => {
                    navigation.emit({
                        type: 'transitionStart',
                        data: { closing: false },
                        target: route.key,
                    });
                }} onAppear={() => {
                    navigation.emit({
                        type: 'transitionEnd',
                        data: { closing: false },
                        target: route.key,
                    });
                }} onDisappear={() => {
                    navigation.emit({
                        type: 'transitionEnd',
                        data: { closing: true },
                        target: route.key,
                    });
                }} onDismissed={(event) => {
                    navigation.dispatch({
                        ...native_1.StackActions.pop(event.nativeEvent.dismissCount),
                        source: route.key,
                        target: state.key,
                    });
                    setNextDismissedKey(route.key);
                }} onHeaderBackButtonClicked={() => {
                    navigation.dispatch({
                        ...native_1.StackActions.pop(),
                        source: route.key,
                        target: state.key,
                    });
                }} onNativeDismissCancelled={(event) => {
                    navigation.dispatch({
                        ...native_1.StackActions.pop(event.nativeEvent.dismissCount),
                        source: route.key,
                        target: state.key,
                    });
                }} onGestureCancel={() => {
                    navigation.emit({
                        type: 'gestureCancel',
                        target: route.key,
                    });
                }} onSheetDetentChanged={(event) => {
                    navigation.emit({
                        type: 'sheetDetentChange',
                        target: route.key,
                        data: {
                            index: event.nativeEvent.index,
                            stable: event.nativeEvent.isStable,
                        },
                    });
                }}/>);
        })}
      </react_native_screens_1.ScreenStack>
    </elements_1.SafeAreaProviderCompat>);
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
//# sourceMappingURL=NativeStackView.native.js.map