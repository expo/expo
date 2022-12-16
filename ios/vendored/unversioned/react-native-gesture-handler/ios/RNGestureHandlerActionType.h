#import <Foundation/Foundation.h>

typedef NS_ENUM(NSInteger, RNGestureHandlerActionType) {
    RNGestureHandlerActionTypeReanimatedWorklet = 1, // Reanimated worklet
    RNGestureHandlerActionTypeNativeAnimatedEvent, // Animated.event with useNativeDriver: true
    RNGestureHandlerActionTypeJSFunctionOldAPI, // JS function or Animated.event with useNativeDriver: false using old RNGH API
    RNGestureHandlerActionTypeJSFunctionNewAPI, // JS function or Animated.event with useNativeDriver: false using new RNGH API
};
