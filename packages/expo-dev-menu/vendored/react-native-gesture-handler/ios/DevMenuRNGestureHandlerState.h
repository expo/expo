#import <Foundation/Foundation.h>

typedef NS_ENUM(NSInteger, DevMenuRNGestureHandlerState) {
    DevMenuRNGestureHandlerStateUndetermined = 0,
    DevMenuRNGestureHandlerStateFailed,
    DevMenuRNGestureHandlerStateBegan,
    DevMenuRNGestureHandlerStateCancelled,
    DevMenuRNGestureHandlerStateActive,
    DevMenuRNGestureHandlerStateEnd,
};
