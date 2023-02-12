#import <Foundation/Foundation.h>

typedef NS_ENUM(NSInteger, DevMenuRNTouchEventType) {
  DevMenuRNTouchEventTypeUndetermined = 0,
  DevMenuRNTouchEventTypePointerDown,
  DevMenuRNTouchEventTypePointerMove,
  DevMenuRNTouchEventTypePointerUp,
  DevMenuRNTouchEventTypeCancelled,
};
