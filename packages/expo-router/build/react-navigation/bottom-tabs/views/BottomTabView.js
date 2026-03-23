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
exports.BottomTabView = BottomTabView;
const React = __importStar(require("react"));
const react_native_1 = require("react-native");
const react_native_safe_area_context_1 = require("react-native-safe-area-context");
const elements_1 = require("../../elements");
const native_1 = require("../../native");
const TransitionPresets_1 = require("../TransitionConfigs/TransitionPresets");
const BottomTabBar_1 = require("./BottomTabBar");
const ScreenFallback_1 = require("./ScreenFallback");
const BottomTabBarHeightCallbackContext_1 = require("../utils/BottomTabBarHeightCallbackContext");
const BottomTabBarHeightContext_1 = require("../utils/BottomTabBarHeightContext");
const useAnimatedHashMap_1 = require("../utils/useAnimatedHashMap");
const EPSILON = 1e-5;
const STATE_INACTIVE = 0;
const STATE_TRANSITIONING_OR_BELOW_TOP = 1;
const STATE_ON_TOP = 2;
const NAMED_TRANSITIONS_PRESETS = {
    fade: TransitionPresets_1.FadeTransition,
    shift: TransitionPresets_1.ShiftTransition,
    none: {
        sceneStyleInterpolator: undefined,
        transitionSpec: {
            animation: 'timing',
            config: { duration: 0 },
        },
    },
};
const useNativeDriver = react_native_1.Platform.OS !== 'web';
const hasAnimation = (options) => {
    const { animation, transitionSpec } = options;
    if (animation) {
        return animation !== 'none';
    }
    return Boolean(transitionSpec);
};
const renderTabBarDefault = (props) => <BottomTabBar_1.BottomTabBar {...props}/>;
function BottomTabView(props) {
    const { tabBar = renderTabBarDefault, state, navigation, descriptors, safeAreaInsets, detachInactiveScreens = react_native_1.Platform.OS === 'web' ||
        react_native_1.Platform.OS === 'android' ||
        react_native_1.Platform.OS === 'ios', } = props;
    const focusedRouteKey = state.routes[state.index].key;
    /**
     * List of loaded tabs, tabs will be loaded when navigated to.
     */
    const [loaded, setLoaded] = React.useState([focusedRouteKey]);
    if (!loaded.includes(focusedRouteKey)) {
        // Set the current tab to be loaded if it was not loaded before
        setLoaded([...loaded, focusedRouteKey]);
    }
    const previousRouteKeyRef = React.useRef(focusedRouteKey);
    const tabAnims = (0, useAnimatedHashMap_1.useAnimatedHashMap)(state);
    React.useEffect(() => {
        const previousRouteKey = previousRouteKeyRef.current;
        let popToTopAction;
        if (previousRouteKey !== focusedRouteKey &&
            descriptors[previousRouteKey]?.options.popToTopOnBlur) {
            const prevRoute = state.routes.find((route) => route.key === previousRouteKey);
            if (prevRoute?.state?.type === 'stack' && prevRoute.state.key) {
                popToTopAction = {
                    ...native_1.StackActions.popToTop(),
                    target: prevRoute.state.key,
                };
            }
        }
        const animateToIndex = () => {
            if (previousRouteKey !== focusedRouteKey) {
                navigation.emit({
                    type: 'transitionStart',
                    target: focusedRouteKey,
                });
            }
            react_native_1.Animated.parallel(state.routes
                .map((route, index) => {
                const { options } = descriptors[route.key];
                const { animation = 'none', transitionSpec = NAMED_TRANSITIONS_PRESETS[animation].transitionSpec, } = options;
                let spec = transitionSpec;
                if (route.key !== previousRouteKey && route.key !== focusedRouteKey) {
                    // Don't animate if the screen is not previous one or new one
                    // This will avoid flicker for screens not involved in the transition
                    spec = NAMED_TRANSITIONS_PRESETS.none.transitionSpec;
                }
                spec = spec ?? NAMED_TRANSITIONS_PRESETS.none.transitionSpec;
                const toValue = index === state.index ? 0 : index >= state.index ? 1 : -1;
                return react_native_1.Animated[spec.animation](tabAnims[route.key], {
                    ...spec.config,
                    toValue,
                    useNativeDriver,
                });
            })
                .filter(Boolean)).start(({ finished }) => {
                if (finished && popToTopAction) {
                    navigation.dispatch(popToTopAction);
                }
                if (previousRouteKey !== focusedRouteKey) {
                    navigation.emit({
                        type: 'transitionEnd',
                        target: focusedRouteKey,
                    });
                }
            });
        };
        animateToIndex();
        previousRouteKeyRef.current = focusedRouteKey;
    }, [descriptors, focusedRouteKey, navigation, state.index, state.routes, tabAnims]);
    const dimensions = elements_1.SafeAreaProviderCompat.initialMetrics.frame;
    const [tabBarHeight, setTabBarHeight] = React.useState(() => (0, BottomTabBar_1.getTabBarHeight)({
        state,
        descriptors,
        dimensions,
        insets: {
            ...elements_1.SafeAreaProviderCompat.initialMetrics.insets,
            ...props.safeAreaInsets,
        },
        style: descriptors[state.routes[state.index].key].options.tabBarStyle,
    }));
    const renderTabBar = () => {
        return (<react_native_safe_area_context_1.SafeAreaInsetsContext.Consumer>
        {(insets) => tabBar({
                state,
                descriptors,
                navigation,
                insets: {
                    top: safeAreaInsets?.top ?? insets?.top ?? 0,
                    right: safeAreaInsets?.right ?? insets?.right ?? 0,
                    bottom: safeAreaInsets?.bottom ?? insets?.bottom ?? 0,
                    left: safeAreaInsets?.left ?? insets?.left ?? 0,
                },
            })}
      </react_native_safe_area_context_1.SafeAreaInsetsContext.Consumer>);
    };
    const { routes } = state;
    // If there is no animation, we only have 2 states: visible and invisible
    const hasTwoStates = !routes.some((route) => hasAnimation(descriptors[route.key].options));
    const { tabBarPosition = 'bottom' } = descriptors[focusedRouteKey].options;
    const tabBarElement = (<BottomTabBarHeightCallbackContext_1.BottomTabBarHeightCallbackContext.Provider key="tabbar" value={setTabBarHeight}>
      {renderTabBar()}
    </BottomTabBarHeightCallbackContext_1.BottomTabBarHeightCallbackContext.Provider>);
    return (<elements_1.SafeAreaProviderCompat style={{
            flexDirection: tabBarPosition === 'left' || tabBarPosition === 'right' ? 'row' : 'column',
        }}>
      {tabBarPosition === 'top' || tabBarPosition === 'left' ? tabBarElement : null}
      <ScreenFallback_1.MaybeScreenContainer key="screens" enabled={detachInactiveScreens} hasTwoStates={hasTwoStates} style={styles.screens}>
        {routes.map((route, index) => {
            const descriptor = descriptors[route.key];
            const { lazy = true, animation = 'none', sceneStyleInterpolator = NAMED_TRANSITIONS_PRESETS[animation].sceneStyleInterpolator, } = descriptor.options;
            const isFocused = state.index === index;
            const isPreloaded = state.preloadedRouteKeys.includes(route.key);
            if (lazy && !loaded.includes(route.key) && !isFocused && !isPreloaded) {
                // Don't render a lazy screen if we've never navigated to it or it wasn't preloaded
                return null;
            }
            const { freezeOnBlur, header = ({ layout, options }) => (<elements_1.Header {...options} layout={layout} title={(0, elements_1.getHeaderTitle)(options, route.name)}/>), headerShown, headerStatusBarHeight, headerTransparent, sceneStyle: customSceneStyle, } = descriptor.options;
            const { sceneStyle } = sceneStyleInterpolator?.({
                current: {
                    progress: tabAnims[route.key],
                },
            }) ?? {};
            const animationEnabled = hasAnimation(descriptor.options);
            const activityState = isFocused
                ? STATE_ON_TOP // the screen is on top after the transition
                : animationEnabled // is animation is not enabled, immediately move to inactive state
                    ? tabAnims[route.key].interpolate({
                        inputRange: [0, 1 - EPSILON, 1],
                        outputRange: [
                            STATE_TRANSITIONING_OR_BELOW_TOP, // screen visible during transition
                            STATE_TRANSITIONING_OR_BELOW_TOP,
                            STATE_INACTIVE, // the screen is detached after transition
                        ],
                        extrapolate: 'extend',
                    })
                    : STATE_INACTIVE;
            return (<ScreenFallback_1.MaybeScreen key={route.key} style={[react_native_1.StyleSheet.absoluteFill, { zIndex: isFocused ? 0 : -1 }]} active={activityState} enabled={detachInactiveScreens} freezeOnBlur={freezeOnBlur} shouldFreeze={activityState === STATE_INACTIVE && !isPreloaded}>
              <BottomTabBarHeightContext_1.BottomTabBarHeightContext.Provider value={tabBarPosition === 'bottom' ? tabBarHeight : 0}>
                <elements_1.Screen focused={isFocused} route={descriptor.route} navigation={descriptor.navigation} headerShown={headerShown} headerStatusBarHeight={headerStatusBarHeight} headerTransparent={headerTransparent} header={header({
                    layout: dimensions,
                    route: descriptor.route,
                    navigation: descriptor.navigation,
                    options: descriptor.options,
                })} style={[customSceneStyle, animationEnabled && sceneStyle]}>
                  {descriptor.render()}
                </elements_1.Screen>
              </BottomTabBarHeightContext_1.BottomTabBarHeightContext.Provider>
            </ScreenFallback_1.MaybeScreen>);
        })}
      </ScreenFallback_1.MaybeScreenContainer>
      {tabBarPosition === 'bottom' || tabBarPosition === 'right' ? tabBarElement : null}
    </elements_1.SafeAreaProviderCompat>);
}
const styles = react_native_1.StyleSheet.create({
    screens: {
        flex: 1,
        overflow: 'hidden',
    },
});
//# sourceMappingURL=BottomTabView.js.map