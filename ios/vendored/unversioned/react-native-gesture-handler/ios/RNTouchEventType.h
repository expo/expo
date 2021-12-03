#import <Foundation/Foundation.h>

typedef NS_ENUM(NSInteger, RNTouchEventType) {
  RNTouchEventTypeUndetermined = 0,
  RNTouchEventTypePointerDown,
  RNTouchEventTypePointerMove,
  RNTouchEventTypePointerUp,
  RNTouchEventTypeCancelled,
};
