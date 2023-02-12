#import "ABI46_0_0RNGestureHandlerButton.h"
#import "ABI46_0_0RNGestureHandlerButtonManager.h"

@implementation ABI46_0_0RNGestureHandlerButtonManager

ABI46_0_0RCT_EXPORT_MODULE(ABI46_0_0RNGestureHandlerButton)

ABI46_0_0RCT_CUSTOM_VIEW_PROPERTY(enabled, BOOL, ABI46_0_0RNGestureHandlerButton)
{
    view.userEnabled = json == nil ? YES : [ABI46_0_0RCTConvert BOOL: json];
}
#if !TARGET_OS_TV
ABI46_0_0RCT_CUSTOM_VIEW_PROPERTY(exclusive, BOOL, ABI46_0_0RNGestureHandlerButton)
{
  [view setExclusiveTouch: json == nil ? YES : [ABI46_0_0RCTConvert BOOL: json]];
}
#endif
ABI46_0_0RCT_CUSTOM_VIEW_PROPERTY(hitSlop, UIEdgeInsets, ABI46_0_0RNGestureHandlerButton)
{
  if (json) {
    UIEdgeInsets hitSlopInsets = [ABI46_0_0RCTConvert UIEdgeInsets:json];
    view.hitTestEdgeInsets = UIEdgeInsetsMake(-hitSlopInsets.top, -hitSlopInsets.left, -hitSlopInsets.bottom, -hitSlopInsets.right);
  } else {
    view.hitTestEdgeInsets = defaultView.hitTestEdgeInsets;
  }
}

- (UIView *)view
{
    return [ABI46_0_0RNGestureHandlerButton new];
}

@end
