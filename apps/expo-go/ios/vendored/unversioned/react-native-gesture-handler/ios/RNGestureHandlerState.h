#import <Foundation/Foundation.h>

typedef NS_ENUM(NSInteger, RNGestureHandlerState) {
  RNGestureHandlerStateUndetermined = 0,
  RNGestureHandlerStateFailed,
  RNGestureHandlerStateBegan,
  RNGestureHandlerStateCancelled,
  RNGestureHandlerStateActive,
  RNGestureHandlerStateEnd,
};
