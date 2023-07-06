#import "ABI49_0_0RNGestureHandlerButtonManager.h"
#import "ABI49_0_0RNGestureHandlerButton.h"

@implementation ABI49_0_0RNGestureHandlerButtonManager

ABI49_0_0RCT_EXPORT_MODULE(ABI49_0_0RNGestureHandlerButton)

ABI49_0_0RCT_CUSTOM_VIEW_PROPERTY(enabled, BOOL, ABI49_0_0RNGestureHandlerButton)
{
  view.userEnabled = json == nil ? YES : [ABI49_0_0RCTConvert BOOL:json];
}
#if !TARGET_OS_TV
ABI49_0_0RCT_CUSTOM_VIEW_PROPERTY(exclusive, BOOL, ABI49_0_0RNGestureHandlerButton)
{
  [view setExclusiveTouch:json == nil ? YES : [ABI49_0_0RCTConvert BOOL:json]];
}
#endif
ABI49_0_0RCT_CUSTOM_VIEW_PROPERTY(hitSlop, UIEdgeInsets, ABI49_0_0RNGestureHandlerButton)
{
  if (json) {
    UIEdgeInsets hitSlopInsets = [ABI49_0_0RCTConvert UIEdgeInsets:json];
    view.hitTestEdgeInsets =
        UIEdgeInsetsMake(-hitSlopInsets.top, -hitSlopInsets.left, -hitSlopInsets.bottom, -hitSlopInsets.right);
  } else {
    view.hitTestEdgeInsets = defaultView.hitTestEdgeInsets;
  }
}

- (UIView *)view
{
  return [ABI49_0_0RNGestureHandlerButton new];
}

@end
