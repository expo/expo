// From a paid collection, do not open source:
// https://www.makeitanimated.dev/

import Animated, {
  cancelAnimation,
  Easing,
  EasingFunction,
  EasingFunctionFactory,
  SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import React, { useLayoutEffect, useState } from 'react';
import { Text } from 'react-native';

import MaskedView from '@react-native-masked-view/masked-view';

// chatgpt-shimmer-text-animation 🔽

type ShimmerTextProps = React.ComponentProps<typeof Text> & {
  children: React.ReactNode;
  speed?: number;
  easing?: EasingFunction | EasingFunctionFactory;
  highlightColor?: string;
  highlightColorZero?: string;
  mask?: boolean;
};

export const ShimmerText = ({
  children,
  speed = 0.6,
  easing = Easing.in(Easing.ease),
  highlightColor = '#ffffff',
  highlightColorZero = '#ffffff00',
  mask = true,
  ...textProps
}: ShimmerTextProps) => {
  const [size, setSize] = useState([0, 0]);
  const textRef = React.useRef<Text>(null);
  const translateX = useSharedValue(-size[0]);

  useLayoutEffect(() => {
    if (textRef.current) {
      const rect = textRef.current.getBoundingClientRect();
      setSize([rect.width, rect.height]);
    }
  }, []);
  const isAnimating = speed > 0;
  // Convert speed (shimmers per second) to duration in milliseconds per shimmer
  const duration = !isAnimating ? 0 : 1000 / speed;

  React.useEffect(() => {
    if (duration === 0) {
      translateX.set(-size[0]);
      cancelAnimation(translateX);
      return;
    }
    translateX.set(
      withRepeat(
        withSequence(
          withTiming(-size[0], { duration: 0 }),
          withTiming(size[0], { duration, easing })
        ),
        -1, // Infinite repetition
        false // Reverse the animation
      )
    );
  }, [duration, easing, size, translateX]);

  return (
    <>
      {/* We need to keep the text with absolute position to have it under mask element so when the gradient moves it will be visible */}
      {/* We also use it to get the text width and height of the component as it's not possible to make dynamically inside the mask */}
      <Text
        ref={textRef}
        style={[
          isAnimating && {
            position: 'absolute',
            top: 0,
            left: 0,
          },
          // !mask && {
          //   width: size[0],
          //   height: size[1],
          // },
          {
            // alignSelf: "flex-start",
            pointerEvents: 'none',
          },
          textProps.style,
        ]}
        numberOfLines={textProps.numberOfLines}
        onLayout={(event) => {
          const { width, height } = event.nativeEvent.layout;
          setSize([width, height]);
        }}>
        {children}
      </Text>

      {isAnimating && (
        <>
          {mask ? (
            <MaskedView
              style={{
                width: size[0],
                height: size[1],
              }}
              maskElement={
                <Text style={textProps.style ?? {}} numberOfLines={textProps.numberOfLines}>
                  {children}
                </Text>
              }>
              <ShimmerView
                translateX={translateX}
                cssGradient={`linear-gradient(to right, ${highlightColorZero} 0%, ${highlightColor} 40%, ${highlightColor} 60%, ${highlightColorZero} 100%)`}
                width={size[0]}
                height={size[1]}
              />
            </MaskedView>
          ) : (
            <ShimmerView
              translateX={translateX}
              cssGradient={`linear-gradient(to right, ${highlightColorZero} 0%, ${highlightColor} 40%, ${highlightColor} 60%, ${highlightColorZero} 100%)`}
              width={size[0]}
              height={size[1]}
            />
          )}
        </>
      )}
    </>
  );
};

function ShimmerView({
  translateX,
  cssGradient,
  width,
  height,
}: {
  translateX: SharedValue<number>;
  cssGradient: string;
  width: number;
  height: number;
}) {
  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: translateX.value }],
    };
  });

  return (
    <Animated.View
      style={[
        {
          width: width,
          height: height,
          [backgroundImage]: cssGradient,
        },
        animatedStyle,
      ]}
    />
  );
}

const backgroundImage =
  process.env.EXPO_OS === 'web' ? `backgroundImage` : `experimental_backgroundImage`;

// chatgpt-shimmer-text-animation 🔼
