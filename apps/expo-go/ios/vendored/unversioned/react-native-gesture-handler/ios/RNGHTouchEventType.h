#import <Foundation/Foundation.h>

typedef NS_ENUM(NSInteger, RNGHTouchEventType) {
  RNGHTouchEventTypeUndetermined = 0,
  RNGHTouchEventTypePointerDown,
  RNGHTouchEventTypePointerMove,
  RNGHTouchEventTypePointerUp,
  RNGHTouchEventTypeCancelled,
};
