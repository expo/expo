#import <Foundation/Foundation.h>

typedef NS_ENUM(NSInteger, ABI49_0_0RNGestureHandlerActionType) {
  ABI49_0_0RNGestureHandlerActionTypeReanimatedWorklet = 1, // Reanimated worklet
  ABI49_0_0RNGestureHandlerActionTypeNativeAnimatedEvent, // Animated.event with useNativeDriver: true
  ABI49_0_0RNGestureHandlerActionTypeJSFunctionOldAPI, // JS function or Animated.event with useNativeDriver: false using old
                                              // ABI49_0_0RNGH API
  ABI49_0_0RNGestureHandlerActionTypeJSFunctionNewAPI, // JS function or Animated.event with useNativeDriver: false using new
                                              // ABI49_0_0RNGH API
};
