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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Card = Card;
const color_1 = __importDefault(require("color"));
const React = __importStar(require("react"));
const react_native_1 = require("react-native");
const useLatestCallback_1 = __importDefault(require("../../../../utils/useLatestCallback"));
const CardAnimationContext_1 = require("../../utils/CardAnimationContext");
const gestureActivationCriteria_1 = require("../../utils/gestureActivationCriteria");
const getDistanceForDirection_1 = require("../../utils/getDistanceForDirection");
const getInvertedMultiplier_1 = require("../../utils/getInvertedMultiplier");
const getShadowStyle_1 = require("../../utils/getShadowStyle");
const GestureHandler_1 = require("../GestureHandler");
const CardContent_1 = require("./CardContent");
const GESTURE_VELOCITY_IMPACT = 0.3;
const TRUE = 1;
const FALSE = 0;
const useNativeDriver = react_native_1.Platform.OS !== 'web';
const hasOpacityStyle = (style) => {
    if (style) {
        const flattenedStyle = react_native_1.StyleSheet.flatten(style);
        return 'opacity' in flattenedStyle && flattenedStyle.opacity != null;
    }
    return false;
};
const getAnimateToValue = ({ closing: isClosing, layout: currentLayout, gestureDirection: currentGestureDirection, direction: currentDirection, preloaded: isPreloaded, }) => {
    if (!isClosing && !isPreloaded) {
        return 0;
    }
    return (0, getDistanceForDirection_1.getDistanceForDirection)(currentLayout, currentGestureDirection, currentDirection === 'rtl');
};
const defaultOverlay = ({ style }) => style ? <react_native_1.Animated.View pointerEvents="none" style={[styles.overlay, style]}/> : null;
function Card({ shadowEnabled = false, gestureEnabled = true, gestureVelocityImpact = GESTURE_VELOCITY_IMPACT, overlay = defaultOverlay, animated, interpolationIndex, opening, closing, next, current, gesture, layout, insets, direction, pageOverflowEnabled, gestureDirection, onOpen, onClose, onTransition, onGestureBegin, onGestureCanceled, onGestureEnd, children, overlayEnabled, gestureResponseDistance, transitionSpec, preloaded, styleInterpolator, containerStyle: customContainerStyle, contentStyle, }) {
    const didInitiallyAnimate = React.useRef(false);
    const lastToValueRef = React.useRef(undefined);
    const interactionHandleRef = React.useRef(undefined);
    const animationHandleRef = React.useRef(undefined);
    const pendingGestureCallbackRef = React.useRef(undefined);
    const pendingOnCloseCallbackRef = React.useRef(undefined);
    const [isClosing] = React.useState(() => new react_native_1.Animated.Value(FALSE));
    const [inverted] = React.useState(() => new react_native_1.Animated.Value((0, getInvertedMultiplier_1.getInvertedMultiplier)(gestureDirection, direction === 'rtl')));
    const [layoutAnim] = React.useState(() => ({
        width: new react_native_1.Animated.Value(layout.width),
        height: new react_native_1.Animated.Value(layout.height),
    }));
    const [isSwiping] = React.useState(() => new react_native_1.Animated.Value(FALSE));
    const onStartInteraction = (0, useLatestCallback_1.default)(() => {
        if (interactionHandleRef.current === undefined) {
            interactionHandleRef.current = react_native_1.InteractionManager.createInteractionHandle();
        }
    });
    const onEndInteraction = (0, useLatestCallback_1.default)(() => {
        if (interactionHandleRef.current !== undefined) {
            react_native_1.InteractionManager.clearInteractionHandle(interactionHandleRef.current);
            interactionHandleRef.current = undefined;
        }
    });
    const animate = (0, useLatestCallback_1.default)(({ closing: isClosingParam, velocity }) => {
        const toValue = getAnimateToValue({
            closing: isClosingParam,
            layout,
            gestureDirection,
            direction,
            preloaded,
        });
        lastToValueRef.current = toValue;
        isClosing.setValue(isClosingParam ? TRUE : FALSE);
        const spec = isClosingParam ? transitionSpec.close : transitionSpec.open;
        const animation = spec.animation === 'spring' ? react_native_1.Animated.spring : react_native_1.Animated.timing;
        clearTimeout(pendingGestureCallbackRef.current);
        if (animationHandleRef.current !== undefined) {
            cancelAnimationFrame(animationHandleRef.current);
        }
        onTransition?.({
            closing: isClosingParam,
            gesture: velocity !== undefined,
        });
        const onFinish = () => {
            if (isClosingParam) {
                onClose();
            }
            else {
                onOpen();
            }
            animationHandleRef.current = requestAnimationFrame(() => {
                // Make sure to re-open screen if it wasn't removed
                maybeAnimate();
            });
        };
        if (animated) {
            onStartInteraction();
            animation(gesture, {
                ...spec.config,
                velocity,
                toValue,
                useNativeDriver,
                isInteraction: false,
            }).start(({ finished }) => {
                onEndInteraction();
                clearTimeout(pendingGestureCallbackRef.current);
                if (finished) {
                    onFinish();
                }
            });
        }
        else {
            onFinish();
        }
    });
    const onGestureStateChange = (0, useLatestCallback_1.default)(({ nativeEvent }) => {
        switch (nativeEvent.state) {
            case GestureHandler_1.GestureState.ACTIVE:
                clearTimeout(pendingGestureCallbackRef.current);
                clearTimeout(pendingOnCloseCallbackRef.current);
                isSwiping.setValue(TRUE);
                onStartInteraction();
                onGestureBegin?.();
                break;
            case GestureHandler_1.GestureState.CANCELLED:
            case GestureHandler_1.GestureState.FAILED: {
                isSwiping.setValue(FALSE);
                onEndInteraction();
                const velocity = gestureDirection === 'vertical' || gestureDirection === 'vertical-inverted'
                    ? nativeEvent.velocityY
                    : nativeEvent.velocityX;
                animate({
                    closing,
                    velocity,
                });
                onGestureCanceled?.();
                break;
            }
            case GestureHandler_1.GestureState.END: {
                isSwiping.setValue(FALSE);
                let distance;
                let translation;
                let velocity;
                if (gestureDirection === 'vertical' || gestureDirection === 'vertical-inverted') {
                    distance = layout.height;
                    translation = nativeEvent.translationY;
                    velocity = nativeEvent.velocityY;
                }
                else {
                    distance = layout.width;
                    translation = nativeEvent.translationX;
                    velocity = nativeEvent.velocityX;
                }
                const shouldClose = (translation + velocity * gestureVelocityImpact) *
                    (0, getInvertedMultiplier_1.getInvertedMultiplier)(gestureDirection, direction === 'rtl') >
                    distance / 2
                    ? velocity !== 0 || translation !== 0
                    : closing;
                animate({ closing: shouldClose, velocity });
                if (shouldClose) {
                    // We call onClose with a delay to make sure that the animation has already started
                    // This will make sure that the state update caused by this doesn't affect start of animation
                    pendingGestureCallbackRef.current = setTimeout(() => {
                        onClose();
                        // Check if the screen is still closing with a delay
                        // So state update from onClose has a chance to go through
                        // If route wasn't removed after onClose, re-open it
                        pendingOnCloseCallbackRef.current = setTimeout(() => {
                            maybeAnimate();
                        }, 32);
                    }, 16);
                }
                onGestureEnd?.();
                break;
            }
        }
    });
    React.useLayoutEffect(() => {
        layoutAnim.width.setValue(layout.width);
        layoutAnim.height.setValue(layout.height);
        inverted.setValue((0, getInvertedMultiplier_1.getInvertedMultiplier)(gestureDirection, direction === 'rtl'));
    }, [
        gestureDirection,
        direction,
        inverted,
        layoutAnim.width,
        layoutAnim.height,
        layout.width,
        layout.height,
    ]);
    const previousPropsRef = React.useRef(null);
    React.useEffect(() => {
        return () => {
            onEndInteraction();
            if (animationHandleRef.current) {
                cancelAnimationFrame(animationHandleRef.current);
            }
            clearTimeout(pendingGestureCallbackRef.current);
            clearTimeout(pendingOnCloseCallbackRef.current);
        };
        // We only want to clean up the animation on unmount
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    const timeoutRef = React.useRef(undefined);
    const maybeAnimate = (0, useLatestCallback_1.default)(() => {
        clearTimeout(pendingGestureCallbackRef.current);
        clearTimeout(pendingOnCloseCallbackRef.current);
        if (!didInitiallyAnimate.current) {
            // Animate the card in on initial mount
            // Wrap in setTimeout to ensure animation starts after
            // rending of the screen is done. This is especially important
            // in the new architecture
            // cf., https://github.com/react-navigation/react-navigation/issues/12401
            clearTimeout(timeoutRef.current);
            timeoutRef.current = setTimeout(() => {
                didInitiallyAnimate.current = true;
                animate({ closing });
            }, 0);
        }
        else {
            const previousOpening = previousPropsRef.current?.opening;
            const previousToValue = previousPropsRef.current
                ? getAnimateToValue(previousPropsRef.current)
                : null;
            const toValue = getAnimateToValue({
                closing,
                layout,
                gestureDirection,
                direction,
                preloaded,
            });
            if (previousToValue !== toValue || lastToValueRef.current !== toValue) {
                // We need to trigger the animation when route was closed
                // The route might have been closed by a `POP` action or by a gesture
                // When route was closed due to a gesture, the animation would've happened already
                // It's still important to trigger the animation so that `onClose` is called
                // If `onClose` is not called, cleanup step won't be performed for gestures
                animate({ closing });
            }
            else if (typeof previousOpening === 'boolean' && opening && !previousOpening) {
                // This can happen when screen somewhere below in the stack comes into focus via rearranging
                // Also reset the animated value to make sure that the animation starts from the beginning
                gesture.setValue((0, getDistanceForDirection_1.getDistanceForDirection)(layout, gestureDirection, direction === 'rtl'));
                animate({ closing });
            }
        }
    });
    React.useEffect(() => {
        if (preloaded) {
            return;
        }
        maybeAnimate();
        previousPropsRef.current = {
            opening,
            closing,
            layout,
            gestureDirection,
            direction,
            preloaded,
        };
    }, [
        animate,
        closing,
        direction,
        gesture,
        gestureDirection,
        layout,
        opening,
        preloaded,
        maybeAnimate,
    ]);
    const interpolationProps = React.useMemo(() => ({
        index: interpolationIndex,
        current: { progress: current },
        next: next && { progress: next },
        closing: isClosing,
        swiping: isSwiping,
        inverted,
        layouts: {
            screen: layout,
        },
        insets: {
            top: insets.top,
            right: insets.right,
            bottom: insets.bottom,
            left: insets.left,
        },
    }), [
        interpolationIndex,
        current,
        next,
        isClosing,
        isSwiping,
        inverted,
        layout,
        insets.top,
        insets.right,
        insets.bottom,
        insets.left,
    ]);
    const { containerStyle, cardStyle, overlayStyle, shadowStyle } = React.useMemo(() => styleInterpolator(interpolationProps), [styleInterpolator, interpolationProps]);
    const onGestureEvent = React.useMemo(() => gestureEnabled
        ? react_native_1.Animated.event([
            {
                nativeEvent: gestureDirection === 'vertical' || gestureDirection === 'vertical-inverted'
                    ? { translationY: gesture }
                    : { translationX: gesture },
            },
        ], { useNativeDriver })
        : undefined, [gesture, gestureDirection, gestureEnabled]);
    const { backgroundColor } = react_native_1.StyleSheet.flatten(contentStyle || {});
    const isTransparent = typeof backgroundColor === 'string' ? (0, color_1.default)(backgroundColor).alpha() === 0 : false;
    return (<CardAnimationContext_1.CardAnimationContext.Provider value={interpolationProps}>
      {react_native_1.Platform.OS !== 'web' ? (<react_native_1.Animated.View style={{
                // This is a dummy style that doesn't actually change anything visually.
                // Animated needs the animated value to be used somewhere, otherwise things don't update properly.
                // If we disable animations and hide header, it could end up making the value unused.
                // So we have this dummy style that will always be used regardless of what else changed.
                opacity: current,
            }} 
        // Make sure that this view isn't removed. If this view is removed, our style with animated value won't apply
        collapsable={false}/>) : null}
      {overlayEnabled ? (<react_native_1.View pointerEvents="box-none" style={react_native_1.StyleSheet.absoluteFill}>
          {overlay({ style: overlayStyle })}
        </react_native_1.View>) : null}
      <react_native_1.Animated.View pointerEvents="box-none" style={[styles.container, containerStyle, customContainerStyle]}>
        <GestureHandler_1.PanGestureHandler enabled={layout.width !== 0 && gestureEnabled} onGestureEvent={onGestureEvent} onHandlerStateChange={onGestureStateChange} {...(0, gestureActivationCriteria_1.gestureActivationCriteria)({
        layout,
        direction,
        gestureDirection,
        gestureResponseDistance,
    })}>
          <react_native_1.Animated.View pointerEvents="box-none" needsOffscreenAlphaCompositing={hasOpacityStyle(cardStyle)} style={[styles.container, cardStyle]}>
            {shadowEnabled && shadowStyle && !isTransparent ? (<react_native_1.Animated.View pointerEvents="none" style={[
                styles.shadow,
                gestureDirection === 'horizontal'
                    ? [styles.shadowHorizontal, styles.shadowStart]
                    : gestureDirection === 'horizontal-inverted'
                        ? [styles.shadowHorizontal, styles.shadowEnd]
                        : gestureDirection === 'vertical'
                            ? [styles.shadowVertical, styles.shadowTop]
                            : [styles.shadowVertical, styles.shadowBottom],
                { backgroundColor },
                shadowStyle,
            ]}/>) : null}
            <CardContent_1.CardContent enabled={pageOverflowEnabled} layout={layout} style={contentStyle}>
              {children}
            </CardContent_1.CardContent>
          </react_native_1.Animated.View>
        </GestureHandler_1.PanGestureHandler>
      </react_native_1.Animated.View>
    </CardAnimationContext_1.CardAnimationContext.Provider>);
}
const styles = react_native_1.StyleSheet.create({
    container: {
        flex: 1,
    },
    overlay: {
        flex: 1,
        backgroundColor: '#000',
    },
    shadow: {
        position: 'absolute',
    },
    shadowHorizontal: {
        top: 0,
        bottom: 0,
        width: 3,
        ...(0, getShadowStyle_1.getShadowStyle)({
            offset: {
                width: -1,
                height: 1,
            },
            radius: 5,
            opacity: 0.3,
        }),
    },
    shadowStart: {
        start: 0,
    },
    shadowEnd: {
        end: 0,
    },
    shadowVertical: {
        start: 0,
        end: 0,
        height: 3,
        ...(0, getShadowStyle_1.getShadowStyle)({
            offset: {
                width: 1,
                height: -1,
            },
            radius: 5,
            opacity: 0.3,
        }),
    },
    shadowTop: {
        top: 0,
    },
    shadowBottom: {
        bottom: 0,
    },
});
//# sourceMappingURL=Card.js.map