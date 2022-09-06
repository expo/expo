#import <Foundation/Foundation.h>

typedef NS_ENUM(NSInteger, ABI46_0_0RNGestureHandlerActionType) {
    ABI46_0_0RNGestureHandlerActionTypeReanimatedWorklet = 1, // Reanimated worklet
    ABI46_0_0RNGestureHandlerActionTypeNativeAnimatedEvent, // Animated.event with useNativeDriver: true
    ABI46_0_0RNGestureHandlerActionTypeJSFunctionOldAPI, // JS function or Animated.event with useNativeDriver: false using old ABI46_0_0RNGH API
    ABI46_0_0RNGestureHandlerActionTypeJSFunctionNewAPI, // JS function or Animated.event with useNativeDriver: false using new ABI46_0_0RNGH API
};
