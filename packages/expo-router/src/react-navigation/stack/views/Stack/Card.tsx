import type { LocaleDirection } from '@react-navigation/native';
import Color from 'color';
import * as React from 'react';
import {
  Animated,
  InteractionManager,
  Platform,
  type StyleProp,
  StyleSheet,
  View,
  type ViewStyle,
} from 'react-native';
import type { EdgeInsets } from 'react-native-safe-area-context';
import useLatestCallback from 'use-latest-callback';

import type {
  GestureDirection,
  Layout,
  StackCardStyleInterpolator,
  TransitionSpec,
} from '../../types';
import { CardAnimationContext } from '../../utils/CardAnimationContext';
import { gestureActivationCriteria } from '../../utils/gestureActivationCriteria';
import { getDistanceForDirection } from '../../utils/getDistanceForDirection';
import { getInvertedMultiplier } from '../../utils/getInvertedMultiplier';
import { getShadowStyle } from '../../utils/getShadowStyle';
import {
  GestureState,
  PanGestureHandler,
  type PanGestureHandlerGestureEvent,
} from '../GestureHandler';
import { CardContent } from './CardContent';

type Props = {
  animated: boolean;
  interpolationIndex: number;
  opening: boolean;
  closing: boolean;
  next: Animated.AnimatedInterpolation<number> | undefined;
  current: Animated.AnimatedInterpolation<number>;
  gesture: Animated.Value;
  layout: Layout;
  insets: EdgeInsets;
  direction: LocaleDirection;
  pageOverflowEnabled: boolean;
  gestureDirection: GestureDirection;
  onOpen: () => void;
  onClose: () => void;
  onTransition: (props: { closing: boolean; gesture: boolean }) => void;
  onGestureBegin: () => void;
  onGestureCanceled: () => void;
  onGestureEnd: () => void;
  children: React.ReactNode;
  overlay:
    | ((props: {
        style: Animated.WithAnimatedValue<StyleProp<ViewStyle>>;
      }) => React.ReactNode)
    | undefined;
  overlayEnabled: boolean;
  shadowEnabled: boolean | undefined;
  gestureEnabled: boolean;
  gestureResponseDistance?: number;
  gestureVelocityImpact: number | undefined;
  transitionSpec: {
    open: TransitionSpec;
    close: TransitionSpec;
  };
  preloaded: boolean;
  styleInterpolator: StackCardStyleInterpolator;
  containerStyle?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
};

const GESTURE_VELOCITY_IMPACT = 0.3;

const TRUE = 1;
const FALSE = 0;

const useNativeDriver = Platform.OS !== 'web';

const hasOpacityStyle = (
  style: Animated.WithAnimatedValue<StyleProp<ViewStyle>>
) => {
  if (style) {
    const flattenedStyle = StyleSheet.flatten(style);

    return 'opacity' in flattenedStyle && flattenedStyle.opacity != null;
  }

  return false;
};

const getAnimateToValue = ({
  closing: isClosing,
  layout: currentLayout,
  gestureDirection: currentGestureDirection,
  direction: currentDirection,
  preloaded: isPreloaded,
}: {
  closing?: boolean;
  layout: Layout;
  gestureDirection: GestureDirection;
  direction: LocaleDirection;
  preloaded: boolean;
}) => {
  if (!isClosing && !isPreloaded) {
    return 0;
  }

  return getDistanceForDirection(
    currentLayout,
    currentGestureDirection,
    currentDirection === 'rtl'
  );
};

const defaultOverlay = ({
  style,
}: {
  style: Animated.WithAnimatedValue<StyleProp<ViewStyle>>;
}) =>
  style ? (
    <Animated.View pointerEvents="none" style={[styles.overlay, style]} />
  ) : null;

function Card({
  shadowEnabled = false,
  gestureEnabled = true,
  gestureVelocityImpact = GESTURE_VELOCITY_IMPACT,
  overlay = defaultOverlay,
  animated,
  interpolationIndex,
  opening,
  closing,
  next,
  current,
  gesture,
  layout,
  insets,
  direction,
  pageOverflowEnabled,
  gestureDirection,
  onOpen,
  onClose,
  onTransition,
  onGestureBegin,
  onGestureCanceled,
  onGestureEnd,
  children,
  overlayEnabled,
  gestureResponseDistance,
  transitionSpec,
  preloaded,
  styleInterpolator,
  containerStyle: customContainerStyle,
  contentStyle,
}: Props) {
  const didInitiallyAnimate = React.useRef(false);
  const lastToValueRef = React.useRef<number | undefined>(undefined);

  const interactionHandleRef = React.useRef<number | undefined>(undefined);
  const animationHandleRef = React.useRef<number | undefined>(undefined);
  const pendingGestureCallbackRef =
    React.useRef<ReturnType<typeof setTimeout>>(undefined);
  const pendingOnCloseCallbackRef =
    React.useRef<ReturnType<typeof setTimeout>>(undefined);

  const [isClosing] = React.useState(() => new Animated.Value(FALSE));

  const [inverted] = React.useState(
    () =>
      new Animated.Value(
        getInvertedMultiplier(gestureDirection, direction === 'rtl')
      )
  );

  const [layoutAnim] = React.useState(() => ({
    width: new Animated.Value(layout.width),
    height: new Animated.Value(layout.height),
  }));

  const [isSwiping] = React.useState(() => new Animated.Value(FALSE));

  const onStartInteraction = useLatestCallback(() => {
    if (interactionHandleRef.current === undefined) {
      interactionHandleRef.current =
        InteractionManager.createInteractionHandle();
    }
  });

  const onEndInteraction = useLatestCallback(() => {
    if (interactionHandleRef.current !== undefined) {
      InteractionManager.clearInteractionHandle(interactionHandleRef.current);
      interactionHandleRef.current = undefined;
    }
  });

  const animate = useLatestCallback(
    ({
      closing: isClosingParam,
      velocity,
    }: {
      closing: boolean;
      velocity?: number;
    }) => {
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
      const animation =
        spec.animation === 'spring' ? Animated.spring : Animated.timing;

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
        } else {
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
      } else {
        onFinish();
      }
    }
  );

  const onGestureStateChange = useLatestCallback(
    ({ nativeEvent }: PanGestureHandlerGestureEvent) => {
      switch (nativeEvent.state) {
        case GestureState.ACTIVE:
          clearTimeout(pendingGestureCallbackRef.current);
          clearTimeout(pendingOnCloseCallbackRef.current);
          isSwiping.setValue(TRUE);
          onStartInteraction();
          onGestureBegin?.();
          break;
        case GestureState.CANCELLED:
        case GestureState.FAILED: {
          isSwiping.setValue(FALSE);
          onEndInteraction();

          const velocity =
            gestureDirection === 'vertical' ||
            gestureDirection === 'vertical-inverted'
              ? nativeEvent.velocityY
              : nativeEvent.velocityX;

          animate({
            closing,
            velocity,
          });

          onGestureCanceled?.();
          break;
        }
        case GestureState.END: {
          isSwiping.setValue(FALSE);

          let distance;
          let translation;
          let velocity;

          if (
            gestureDirection === 'vertical' ||
            gestureDirection === 'vertical-inverted'
          ) {
            distance = layout.height;
            translation = nativeEvent.translationY;
            velocity = nativeEvent.velocityY;
          } else {
            distance = layout.width;
            translation = nativeEvent.translationX;
            velocity = nativeEvent.velocityX;
          }

          const shouldClose =
            (translation + velocity * gestureVelocityImpact) *
              getInvertedMultiplier(gestureDirection, direction === 'rtl') >
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
    }
  );

  React.useLayoutEffect(() => {
    layoutAnim.width.setValue(layout.width);
    layoutAnim.height.setValue(layout.height);
    inverted.setValue(
      getInvertedMultiplier(gestureDirection, direction === 'rtl')
    );
  }, [
    gestureDirection,
    direction,
    inverted,
    layoutAnim.width,
    layoutAnim.height,
    layout.width,
    layout.height,
  ]);

  const previousPropsRef = React.useRef<{
    opening: boolean;
    closing: boolean;
    layout: Layout;
    direction: LocaleDirection;
    gestureDirection: GestureDirection;
    preloaded: boolean;
  } | null>(null);

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

  const timeoutRef = React.useRef<ReturnType<typeof setTimeout>>(undefined);

  const maybeAnimate = useLatestCallback(() => {
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
    } else {
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
      } else if (
        typeof previousOpening === 'boolean' &&
        opening &&
        !previousOpening
      ) {
        // This can happen when screen somewhere below in the stack comes into focus via rearranging
        // Also reset the animated value to make sure that the animation starts from the beginning
        gesture.setValue(
          getDistanceForDirection(layout, gestureDirection, direction === 'rtl')
        );

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

  const interpolationProps = React.useMemo(
    () => ({
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
    }),
    [
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
    ]
  );

  const { containerStyle, cardStyle, overlayStyle, shadowStyle } =
    React.useMemo(
      () => styleInterpolator(interpolationProps),
      [styleInterpolator, interpolationProps]
    );

  const onGestureEvent = React.useMemo(
    () =>
      gestureEnabled
        ? Animated.event(
            [
              {
                nativeEvent:
                  gestureDirection === 'vertical' ||
                  gestureDirection === 'vertical-inverted'
                    ? { translationY: gesture }
                    : { translationX: gesture },
              },
            ],
            { useNativeDriver }
          )
        : undefined,
    [gesture, gestureDirection, gestureEnabled]
  );

  const { backgroundColor } = StyleSheet.flatten(contentStyle || {});

  const isTransparent =
    typeof backgroundColor === 'string'
      ? Color(backgroundColor).alpha() === 0
      : false;

  return (
    <CardAnimationContext.Provider value={interpolationProps}>
      {Platform.OS !== 'web' ? (
        <Animated.View
          style={{
            // This is a dummy style that doesn't actually change anything visually.
            // Animated needs the animated value to be used somewhere, otherwise things don't update properly.
            // If we disable animations and hide header, it could end up making the value unused.
            // So we have this dummy style that will always be used regardless of what else changed.
            opacity: current,
          }}
          // Make sure that this view isn't removed. If this view is removed, our style with animated value won't apply
          collapsable={false}
        />
      ) : null}
      {overlayEnabled ? (
        <View pointerEvents="box-none" style={StyleSheet.absoluteFill}>
          {overlay({ style: overlayStyle })}
        </View>
      ) : null}
      <Animated.View
        pointerEvents="box-none"
        style={[styles.container, containerStyle, customContainerStyle]}
      >
        <PanGestureHandler
          enabled={layout.width !== 0 && gestureEnabled}
          onGestureEvent={onGestureEvent}
          onHandlerStateChange={onGestureStateChange}
          {...gestureActivationCriteria({
            layout,
            direction,
            gestureDirection,
            gestureResponseDistance,
          })}
        >
          <Animated.View
            pointerEvents="box-none"
            needsOffscreenAlphaCompositing={hasOpacityStyle(cardStyle)}
            style={[styles.container, cardStyle]}
          >
            {shadowEnabled && shadowStyle && !isTransparent ? (
              <Animated.View
                pointerEvents="none"
                style={[
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
                ]}
              />
            ) : null}
            <CardContent
              enabled={pageOverflowEnabled}
              layout={layout}
              style={contentStyle}
            >
              {children}
            </CardContent>
          </Animated.View>
        </PanGestureHandler>
      </Animated.View>
    </CardAnimationContext.Provider>
  );
}

export { Card };

const styles = StyleSheet.create({
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
    ...getShadowStyle({
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
    ...getShadowStyle({
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
