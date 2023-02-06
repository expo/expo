#import <Foundation/Foundation.h>

typedef NS_ENUM(NSInteger, ABI48_0_0RNGestureHandlerActionType) {
  ABI48_0_0RNGestureHandlerActionTypeReanimatedWorklet = 1, // Reanimated worklet
  ABI48_0_0RNGestureHandlerActionTypeNativeAnimatedEvent, // Animated.event with useNativeDriver: true
  ABI48_0_0RNGestureHandlerActionTypeJSFunctionOldAPI, // JS function or Animated.event with useNativeDriver: false using old
                                              // ABI48_0_0RNGH API
  ABI48_0_0RNGestureHandlerActionTypeJSFunctionNewAPI, // JS function or Animated.event with useNativeDriver: false using new
                                              // ABI48_0_0RNGH API
};
