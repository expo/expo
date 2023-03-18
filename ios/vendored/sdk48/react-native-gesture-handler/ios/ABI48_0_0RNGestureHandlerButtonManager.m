#import "ABI48_0_0RNGestureHandlerButtonManager.h"
#import "ABI48_0_0RNGestureHandlerButton.h"

@implementation ABI48_0_0RNGestureHandlerButtonManager

ABI48_0_0RCT_EXPORT_MODULE(ABI48_0_0RNGestureHandlerButton)

ABI48_0_0RCT_CUSTOM_VIEW_PROPERTY(enabled, BOOL, ABI48_0_0RNGestureHandlerButton)
{
  view.userEnabled = json == nil ? YES : [ABI48_0_0RCTConvert BOOL:json];
}
#if !TARGET_OS_TV
ABI48_0_0RCT_CUSTOM_VIEW_PROPERTY(exclusive, BOOL, ABI48_0_0RNGestureHandlerButton)
{
  [view setExclusiveTouch:json == nil ? YES : [ABI48_0_0RCTConvert BOOL:json]];
}
#endif
ABI48_0_0RCT_CUSTOM_VIEW_PROPERTY(hitSlop, UIEdgeInsets, ABI48_0_0RNGestureHandlerButton)
{
  if (json) {
    UIEdgeInsets hitSlopInsets = [ABI48_0_0RCTConvert UIEdgeInsets:json];
    view.hitTestEdgeInsets =
        UIEdgeInsetsMake(-hitSlopInsets.top, -hitSlopInsets.left, -hitSlopInsets.bottom, -hitSlopInsets.right);
  } else {
    view.hitTestEdgeInsets = defaultView.hitTestEdgeInsets;
  }
}

- (UIView *)view
{
  return [ABI48_0_0RNGestureHandlerButton new];
}

@end
