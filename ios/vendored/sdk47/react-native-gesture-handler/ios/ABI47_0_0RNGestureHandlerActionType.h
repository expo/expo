#import <Foundation/Foundation.h>

typedef NS_ENUM(NSInteger, ABI47_0_0RNGestureHandlerActionType) {
    ABI47_0_0RNGestureHandlerActionTypeReanimatedWorklet = 1, // Reanimated worklet
    ABI47_0_0RNGestureHandlerActionTypeNativeAnimatedEvent, // Animated.event with useNativeDriver: true
    ABI47_0_0RNGestureHandlerActionTypeJSFunctionOldAPI, // JS function or Animated.event with useNativeDriver: false using old ABI47_0_0RNGH API
    ABI47_0_0RNGestureHandlerActionTypeJSFunctionNewAPI, // JS function or Animated.event with useNativeDriver: false using new ABI47_0_0RNGH API
};
