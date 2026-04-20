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
exports.CardStack = void 0;
exports.getAnimationEnabled = getAnimationEnabled;
const React = __importStar(require("react"));
const react_native_1 = require("react-native");
const elements_1 = require("../../../elements");
const CardStyleInterpolators_1 = require("../../TransitionConfigs/CardStyleInterpolators");
const TransitionPresets_1 = require("../../TransitionConfigs/TransitionPresets");
const findLastIndex_1 = require("../../utils/findLastIndex");
const getDistanceForDirection_1 = require("../../utils/getDistanceForDirection");
const getModalRoutesKeys_1 = require("../../utils/getModalRoutesKeys");
const Screens_1 = require("../Screens");
const CardContainer_1 = require("./CardContainer");
const NAMED_TRANSITIONS_PRESETS = {
    default: TransitionPresets_1.DefaultTransition,
    fade: TransitionPresets_1.ModalFadeTransition,
    fade_from_bottom: TransitionPresets_1.FadeFromBottomAndroid,
    fade_from_right: TransitionPresets_1.FadeFromRightAndroid,
    none: TransitionPresets_1.DefaultTransition,
    reveal_from_bottom: TransitionPresets_1.RevealFromBottomAndroid,
    scale_from_center: TransitionPresets_1.ScaleFromCenterAndroid,
    slide_from_left: TransitionPresets_1.SlideFromLeftIOS,
    slide_from_right: TransitionPresets_1.SlideFromRightIOS,
    slide_from_bottom: react_native_1.Platform.select({
        ios: TransitionPresets_1.ModalSlideFromBottomIOS,
        default: TransitionPresets_1.BottomSheetAndroid,
    }),
};
const EPSILON = 1e-5;
const STATE_INACTIVE = 0;
const STATE_TRANSITIONING_OR_BELOW_TOP = 1;
const STATE_ON_TOP = 2;
const FALLBACK_DESCRIPTOR = Object.freeze({ options: {} });
const getInterpolationIndex = (scenes, index) => {
    const { cardStyleInterpolator } = scenes[index].descriptor.options;
    // Start from current card and count backwards the number of cards with same interpolation
    let interpolationIndex = 0;
    for (let i = index - 1; i >= 0; i--) {
        const cardStyleInterpolatorCurrent = scenes[i]?.descriptor.options.cardStyleInterpolator;
        if (cardStyleInterpolatorCurrent !== cardStyleInterpolator) {
            break;
        }
        interpolationIndex++;
    }
    return interpolationIndex;
};
const getIsModalPresentation = (cardStyleInterpolator) => {
    return (cardStyleInterpolator === CardStyleInterpolators_1.forModalPresentationIOS ||
        // Handle custom modal presentation interpolators as well
        cardStyleInterpolator.name === 'forModalPresentationIOS');
};
const getIsModal = (scene, interpolationIndex, isParentModal) => {
    if (isParentModal) {
        return true;
    }
    const { cardStyleInterpolator } = scene.descriptor.options;
    const isModalPresentation = getIsModalPresentation(cardStyleInterpolator);
    const isModal = isModalPresentation && interpolationIndex !== 0;
    return isModal;
};
const getHeaderHeights = (scenes, insets, isParentHeaderShown, isParentModal, layout, previous) => {
    return scenes.reduce((acc, curr, index) => {
        const { headerStatusBarHeight = isParentHeaderShown ? 0 : insets.top, headerStyle } = curr.descriptor.options;
        const style = react_native_1.StyleSheet.flatten(headerStyle || {});
        const height = 'height' in style && typeof style.height === 'number'
            ? style.height
            : previous[curr.route.key];
        const interpolationIndex = getInterpolationIndex(scenes, index);
        const isModal = getIsModal(curr, interpolationIndex, isParentModal);
        acc[curr.route.key] =
            typeof height === 'number'
                ? height
                : (0, elements_1.getDefaultHeaderHeight)(layout, isModal, headerStatusBarHeight);
        return acc;
    }, {});
};
const getDistanceFromOptions = (layout, options, isRTL) => {
    if (options?.gestureDirection) {
        return (0, getDistanceForDirection_1.getDistanceForDirection)(layout, options.gestureDirection, isRTL);
    }
    const defaultGestureDirection = options?.presentation === 'modal'
        ? TransitionPresets_1.ModalTransition.gestureDirection
        : TransitionPresets_1.DefaultTransition.gestureDirection;
    const gestureDirection = options?.animation
        ? NAMED_TRANSITIONS_PRESETS[options?.animation]?.gestureDirection
        : defaultGestureDirection;
    return (0, getDistanceForDirection_1.getDistanceForDirection)(layout, gestureDirection, isRTL);
};
const getProgressFromGesture = (gesture, layout, options, isRTL) => {
    const distance = getDistanceFromOptions({
        // Make sure that we have a non-zero distance, otherwise there will be incorrect progress
        // This causes blank screen on web if it was previously inside container with display: none
        width: Math.max(1, layout.width),
        height: Math.max(1, layout.height),
    }, options, isRTL);
    if (distance > 0) {
        return gesture.interpolate({
            inputRange: [0, distance],
            outputRange: [1, 0],
        });
    }
    return gesture.interpolate({
        inputRange: [distance, 0],
        outputRange: [0, 1],
    });
};
function getDefaultAnimation(animation) {
    // Disable screen transition animation by default on web, windows and macos to match the native behavior
    const excludedPlatforms = react_native_1.Platform.OS !== 'web' && react_native_1.Platform.OS !== 'windows' && react_native_1.Platform.OS !== 'macos';
    return animation ?? (excludedPlatforms ? 'default' : 'none');
}
function getAnimationEnabled(animation) {
    return getDefaultAnimation(animation) !== 'none';
}
class CardStack extends React.Component {
    static getDerivedStateFromProps(props, state) {
        if (props.routes === state.routes && props.descriptors === state.descriptors) {
            return null;
        }
        const gestures = [...props.routes, ...props.state.preloadedRoutes].reduce((acc, curr) => {
            const descriptor = props.descriptors[curr.key] || props.preloadedDescriptors[curr.key];
            const { animation } = descriptor?.options || {};
            acc[curr.key] =
                state.gestures[curr.key] ||
                    new react_native_1.Animated.Value((props.openingRouteKeys.includes(curr.key) && getAnimationEnabled(animation)) ||
                        props.state.preloadedRoutes.includes(curr)
                        ? getDistanceFromOptions(state.layout, descriptor?.options, props.direction === 'rtl')
                        : 0);
            return acc;
        }, {});
        const modalRouteKeys = (0, getModalRoutesKeys_1.getModalRouteKeys)([...props.routes, ...props.state.preloadedRoutes], {
            ...props.descriptors,
            ...props.preloadedDescriptors,
        });
        const scenes = [...props.routes, ...props.state.preloadedRoutes].map((route, index, self) => {
            // For preloaded screens, we don't care about the previous and the next screen
            const isPreloaded = props.state.preloadedRoutes.includes(route);
            const previousRoute = isPreloaded ? undefined : self[index - 1];
            const nextRoute = isPreloaded ? undefined : self[index + 1];
            const oldScene = state.scenes[index];
            const currentGesture = gestures[route.key];
            const previousGesture = previousRoute ? gestures[previousRoute.key] : undefined;
            const nextGesture = nextRoute ? gestures[nextRoute.key] : undefined;
            const descriptor = (isPreloaded ? props.preloadedDescriptors : props.descriptors)[route.key] ||
                state.descriptors[route.key] ||
                (oldScene ? oldScene.descriptor : FALLBACK_DESCRIPTOR);
            const nextOptions = nextRoute &&
                (props.descriptors[nextRoute?.key] || state.descriptors[nextRoute?.key])?.options;
            const previousOptions = previousRoute &&
                (props.descriptors[previousRoute?.key] || state.descriptors[previousRoute?.key])?.options;
            // When a screen is not the last, it should use next screen's transition config
            // Many transitions also animate the previous screen, so using 2 different transitions doesn't look right
            // For example combining a slide and a modal transition would look wrong otherwise
            // With this approach, combining different transition styles in the same navigator mostly looks right
            // This will still be broken when 2 transitions have different idle state (e.g. modal presentation),
            // but the majority of the transitions look alright
            const optionsForTransitionConfig = index !== self.length - 1 && nextOptions && nextOptions?.presentation !== 'transparentModal'
                ? nextOptions
                : descriptor.options;
            // Assume modal if there are already modal screens in the stack
            // or current screen is a modal when no presentation is specified
            const isModal = modalRouteKeys.includes(route.key);
            const animation = getDefaultAnimation(optionsForTransitionConfig.animation);
            const isAnimationEnabled = getAnimationEnabled(animation);
            const transitionPreset = animation !== 'default'
                ? NAMED_TRANSITIONS_PRESETS[animation]
                : optionsForTransitionConfig.presentation === 'transparentModal'
                    ? TransitionPresets_1.ModalFadeTransition
                    : optionsForTransitionConfig.presentation === 'modal' || isModal
                        ? TransitionPresets_1.ModalTransition
                        : TransitionPresets_1.DefaultTransition;
            const { gestureEnabled = react_native_1.Platform.OS === 'ios' && isAnimationEnabled, gestureDirection = transitionPreset.gestureDirection, transitionSpec = transitionPreset.transitionSpec, cardStyleInterpolator = isAnimationEnabled
                ? transitionPreset.cardStyleInterpolator
                : CardStyleInterpolators_1.forNoAnimation, headerStyleInterpolator = transitionPreset.headerStyleInterpolator, cardOverlayEnabled = (react_native_1.Platform.OS !== 'ios' &&
                optionsForTransitionConfig.presentation !== 'transparentModal') ||
                getIsModalPresentation(cardStyleInterpolator), } = optionsForTransitionConfig;
            const headerMode = descriptor.options.headerMode ??
                (!(optionsForTransitionConfig.presentation === 'modal' ||
                    optionsForTransitionConfig.presentation === 'transparentModal' ||
                    nextOptions?.presentation === 'modal' ||
                    nextOptions?.presentation === 'transparentModal' ||
                    getIsModalPresentation(cardStyleInterpolator)) &&
                    react_native_1.Platform.OS === 'ios' &&
                    descriptor.options.header === undefined
                    ? 'float'
                    : 'screen');
            const isRTL = props.direction === 'rtl';
            const scene = {
                route,
                descriptor: {
                    ...descriptor,
                    options: {
                        ...descriptor.options,
                        animation,
                        cardOverlayEnabled,
                        cardStyleInterpolator,
                        gestureDirection,
                        gestureEnabled,
                        headerStyleInterpolator,
                        transitionSpec,
                        headerMode,
                    },
                },
                progress: {
                    current: getProgressFromGesture(currentGesture, state.layout, descriptor.options, isRTL),
                    next: nextGesture && nextOptions?.presentation !== 'transparentModal'
                        ? getProgressFromGesture(nextGesture, state.layout, nextOptions, isRTL)
                        : undefined,
                    previous: previousGesture
                        ? getProgressFromGesture(previousGesture, state.layout, previousOptions, isRTL)
                        : undefined,
                },
                __memo: [
                    state.layout,
                    descriptor,
                    nextOptions,
                    previousOptions,
                    currentGesture,
                    nextGesture,
                    previousGesture,
                ],
            };
            if (oldScene &&
                scene.__memo.every((it, i) => {
                    // @ts-expect-error: we haven't added __memo to the annotation to prevent usage elsewhere
                    return oldScene.__memo[i] === it;
                })) {
                return oldScene;
            }
            return scene;
        });
        let activeStates = state.activeStates;
        if (props.routes.length !== state.routes.length) {
            let activeScreensLimit = 1;
            for (let i = props.routes.length - 1; i >= 0; i--) {
                const { options } = scenes[i].descriptor;
                const { 
                // By default, we don't want to detach the previous screen of the active one for modals
                detachPreviousScreen = options.presentation === 'transparentModal'
                    ? false
                    : getIsModalPresentation(options.cardStyleInterpolator)
                        ? i !==
                            (0, findLastIndex_1.findLastIndex)(scenes, (scene) => {
                                const { cardStyleInterpolator } = scene.descriptor.options;
                                return (cardStyleInterpolator === CardStyleInterpolators_1.forModalPresentationIOS ||
                                    cardStyleInterpolator?.name === 'forModalPresentationIOS');
                            })
                        : true, } = options;
                if (detachPreviousScreen === false) {
                    activeScreensLimit++;
                }
                else {
                    // Check at least last 2 screens before stopping
                    // This will make sure that screen isn't detached when another screen is animating on top of the transparent one
                    // e.g. opaque -> transparent -> opaque
                    if (i <= props.routes.length - 2) {
                        break;
                    }
                }
            }
            activeStates = props.routes.map((_, index, self) => {
                // The activity state represents state of the screen:
                // 0 - inactive, the screen is detached
                // 1 - transitioning or below the top screen, the screen is mounted but interaction is disabled
                // 2 - on top of the stack, the screen is mounted and interaction is enabled
                let activityState;
                const lastActiveState = state.activeStates[index];
                const activeAfterTransition = index >= self.length - activeScreensLimit;
                if (lastActiveState === STATE_INACTIVE && !activeAfterTransition) {
                    // screen was inactive before and it will still be inactive after the transition
                    activityState = STATE_INACTIVE;
                }
                else {
                    const sceneForActivity = scenes[self.length - 1];
                    const outputValue = index === self.length - 1
                        ? STATE_ON_TOP // the screen is on top after the transition
                        : activeAfterTransition
                            ? STATE_TRANSITIONING_OR_BELOW_TOP // the screen should stay active after the transition, it is not on top but is in activeLimit
                            : STATE_INACTIVE; // the screen should be active only during the transition, it is at the edge of activeLimit
                    activityState = sceneForActivity
                        ? sceneForActivity.progress.current.interpolate({
                            inputRange: [0, 1 - EPSILON, 1],
                            outputRange: [1, 1, outputValue],
                            extrapolate: 'clamp',
                        })
                        : STATE_TRANSITIONING_OR_BELOW_TOP;
                }
                return activityState;
            });
        }
        return {
            routes: props.routes,
            scenes,
            gestures,
            descriptors: props.descriptors,
            activeStates,
            headerHeights: getHeaderHeights(scenes, props.insets, props.isParentHeaderShown, props.isParentModal, state.layout, state.headerHeights),
        };
    }
    constructor(props) {
        super(props);
        this.state = {
            routes: [],
            scenes: [],
            gestures: {},
            layout: elements_1.SafeAreaProviderCompat.initialMetrics.frame,
            descriptors: this.props.descriptors,
            activeStates: [],
            // Used when card's header is null and mode is float to make transition
            // between screens with headers and those without headers smooth.
            // This is not a great heuristic here. We don't know synchronously
            // on mount what the header height is so we have just used the most
            // common cases here.
            headerHeights: {},
        };
    }
    handleLayout = (e) => {
        const { height, width } = e.nativeEvent.layout;
        const layout = { width, height };
        this.setState((state, props) => {
            if (height === state.layout.height && width === state.layout.width) {
                return null;
            }
            return {
                layout,
                headerHeights: getHeaderHeights(state.scenes, props.insets, props.isParentHeaderShown, props.isParentModal, layout, state.headerHeights),
            };
        });
    };
    handleHeaderLayout = ({ route, height }) => {
        this.setState(({ headerHeights }) => {
            const previousHeight = headerHeights[route.key];
            if (previousHeight === height) {
                return null;
            }
            return {
                headerHeights: {
                    ...headerHeights,
                    [route.key]: height,
                },
            };
        });
    };
    getFocusedRoute = () => {
        const { state } = this.props;
        return state.routes[state.index];
    };
    getPreviousScene = ({ route }) => {
        const { getPreviousRoute } = this.props;
        const { scenes } = this.state;
        const previousRoute = getPreviousRoute({ route });
        if (previousRoute) {
            const previousScene = scenes.find((scene) => scene.descriptor.route.key === previousRoute.key);
            return previousScene;
        }
        return undefined;
    };
    render() {
        const { insets, state, routes, openingRouteKeys, closingRouteKeys, onOpenRoute, onCloseRoute, renderHeader, isParentHeaderShown, isParentModal, onTransitionStart, onTransitionEnd, onGestureStart, onGestureEnd, onGestureCancel, detachInactiveScreens = react_native_1.Platform.OS === 'web' ||
            react_native_1.Platform.OS === 'android' ||
            react_native_1.Platform.OS === 'ios', } = this.props;
        const { scenes, layout, gestures, activeStates, headerHeights } = this.state;
        const focusedRoute = state.routes[state.index];
        const focusedHeaderHeight = headerHeights[focusedRoute.key];
        const isFloatHeaderAbsolute = this.state.scenes.slice(-2).some((scene) => {
            const options = scene.descriptor.options ?? {};
            const { headerMode, headerTransparent, headerShown = true } = options;
            if (headerTransparent || headerShown === false || headerMode === 'screen') {
                return true;
            }
            return false;
        });
        return (<react_native_1.View style={styles.container}>
        {renderHeader({
                mode: 'float',
                layout,
                scenes,
                getPreviousScene: this.getPreviousScene,
                getFocusedRoute: this.getFocusedRoute,
                onContentHeightChange: this.handleHeaderLayout,
                style: [
                    styles.floating,
                    isFloatHeaderAbsolute && [
                        // Without this, the header buttons won't be touchable on Android when headerTransparent: true
                        { height: focusedHeaderHeight },
                        styles.absolute,
                    ],
                ],
            })}
        <Screens_1.MaybeScreenContainer enabled={detachInactiveScreens} style={styles.container} onLayout={this.handleLayout}>
          {[...routes, ...state.preloadedRoutes].map((route, index) => {
                const focused = focusedRoute.key === route.key;
                const gesture = gestures[route.key];
                const scene = scenes[index];
                // It is possible that for a short period the route appears in both arrays.
                // Particularly, if the screen is removed with `retain`, then it needs a moment to execute the animation.
                // However, due to the router action, it immediately populates the `preloadedRoutes` array.
                // Practically, the logic below takes care that it is rendered only once.
                const isPreloaded = state.preloadedRoutes.includes(route) && !routes.includes(route);
                if (state.preloadedRoutes.includes(route) &&
                    routes.includes(route) &&
                    index >= routes.length) {
                    return null;
                }
                const { headerShown = true, headerTransparent, freezeOnBlur, autoHideHomeIndicator, } = scene.descriptor.options;
                const safeAreaInsetTop = insets.top;
                const safeAreaInsetRight = insets.right;
                const safeAreaInsetBottom = insets.bottom;
                const safeAreaInsetLeft = insets.left;
                const headerHeight = headerShown !== false ? headerHeights[route.key] : 0;
                // Start from current card and count backwards the number of cards with same interpolation
                const interpolationIndex = getInterpolationIndex(scenes, index);
                const isModal = getIsModal(scene, interpolationIndex, isParentModal);
                const isNextScreenTransparent = scenes[index + 1]?.descriptor.options.presentation === 'transparentModal';
                const detachCurrentScreen = scenes[index + 1]?.descriptor.options.detachPreviousScreen !== false;
                const activityState = isPreloaded ? STATE_INACTIVE : activeStates[index];
                return (<Screens_1.MaybeScreen key={route.key} style={[react_native_1.StyleSheet.absoluteFill]} enabled={detachInactiveScreens} active={activityState} freezeOnBlur={freezeOnBlur} shouldFreeze={activityState === STATE_INACTIVE && !isPreloaded} homeIndicatorHidden={autoHideHomeIndicator} pointerEvents="box-none">
                <CardContainer_1.CardContainer index={index} interpolationIndex={interpolationIndex} modal={isModal} active={index === routes.length - 1} focused={focused} opening={openingRouteKeys.includes(route.key)} closing={closingRouteKeys.includes(route.key)} layout={layout} gesture={gesture} scene={scene} safeAreaInsetTop={safeAreaInsetTop} safeAreaInsetRight={safeAreaInsetRight} safeAreaInsetBottom={safeAreaInsetBottom} safeAreaInsetLeft={safeAreaInsetLeft} onGestureStart={onGestureStart} onGestureCancel={onGestureCancel} onGestureEnd={onGestureEnd} headerHeight={headerHeight} isParentHeaderShown={isParentHeaderShown} onHeaderHeightChange={this.handleHeaderLayout} getPreviousScene={this.getPreviousScene} getFocusedRoute={this.getFocusedRoute} hasAbsoluteFloatHeader={isFloatHeaderAbsolute && !headerTransparent} renderHeader={renderHeader} onOpenRoute={onOpenRoute} onCloseRoute={onCloseRoute} onTransitionStart={onTransitionStart} onTransitionEnd={onTransitionEnd} isNextScreenTransparent={isNextScreenTransparent} detachCurrentScreen={detachCurrentScreen} preloaded={isPreloaded}/>
              </Screens_1.MaybeScreen>);
            })}
        </Screens_1.MaybeScreenContainer>
      </react_native_1.View>);
    }
}
exports.CardStack = CardStack;
const styles = react_native_1.StyleSheet.create({
    container: {
        flex: 1,
    },
    absolute: {
        position: 'absolute',
        top: 0,
        start: 0,
        end: 0,
    },
    floating: {
        zIndex: 1,
    },
});
//# sourceMappingURL=CardStack.js.map