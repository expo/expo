#import "ABI47_0_0RNGestureHandlerButton.h"
#import "ABI47_0_0RNGestureHandlerButtonManager.h"

@implementation ABI47_0_0RNGestureHandlerButtonManager

ABI47_0_0RCT_EXPORT_MODULE(ABI47_0_0RNGestureHandlerButton)

ABI47_0_0RCT_CUSTOM_VIEW_PROPERTY(enabled, BOOL, ABI47_0_0RNGestureHandlerButton)
{
    view.userEnabled = json == nil ? YES : [ABI47_0_0RCTConvert BOOL: json];
}
#if !TARGET_OS_TV
ABI47_0_0RCT_CUSTOM_VIEW_PROPERTY(exclusive, BOOL, ABI47_0_0RNGestureHandlerButton)
{
  [view setExclusiveTouch: json == nil ? YES : [ABI47_0_0RCTConvert BOOL: json]];
}
#endif
ABI47_0_0RCT_CUSTOM_VIEW_PROPERTY(hitSlop, UIEdgeInsets, ABI47_0_0RNGestureHandlerButton)
{
  if (json) {
    UIEdgeInsets hitSlopInsets = [ABI47_0_0RCTConvert UIEdgeInsets:json];
    view.hitTestEdgeInsets = UIEdgeInsetsMake(-hitSlopInsets.top, -hitSlopInsets.left, -hitSlopInsets.bottom, -hitSlopInsets.right);
  } else {
    view.hitTestEdgeInsets = defaultView.hitTestEdgeInsets;
  }
}

- (UIView *)view
{
    return [ABI47_0_0RNGestureHandlerButton new];
}

@end
