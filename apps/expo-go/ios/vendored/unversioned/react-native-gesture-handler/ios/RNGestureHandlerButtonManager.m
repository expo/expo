#import "RNGestureHandlerButtonManager.h"
#import "RNGestureHandlerButton.h"

@implementation RNGestureHandlerButtonManager

RCT_EXPORT_MODULE(RNGestureHandlerButton)

RCT_CUSTOM_VIEW_PROPERTY(enabled, BOOL, RNGestureHandlerButton)
{
  view.userEnabled = json == nil ? YES : [RCTConvert BOOL:json];
}
#if !TARGET_OS_TV
RCT_CUSTOM_VIEW_PROPERTY(exclusive, BOOL, RNGestureHandlerButton)
{
  [view setExclusiveTouch:json == nil ? YES : [RCTConvert BOOL:json]];
}
#endif
RCT_CUSTOM_VIEW_PROPERTY(hitSlop, UIEdgeInsets, RNGestureHandlerButton)
{
  if (json) {
    UIEdgeInsets hitSlopInsets = [RCTConvert UIEdgeInsets:json];
    view.hitTestEdgeInsets =
        UIEdgeInsetsMake(-hitSlopInsets.top, -hitSlopInsets.left, -hitSlopInsets.bottom, -hitSlopInsets.right);
  } else {
    view.hitTestEdgeInsets = defaultView.hitTestEdgeInsets;
  }
}

- (UIView *)view
{
  return [RNGestureHandlerButton new];
}

@end
