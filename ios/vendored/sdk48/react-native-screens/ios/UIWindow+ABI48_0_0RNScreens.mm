#import "ABI48_0_0RNSFullWindowOverlay.h"
#import "UIWindow+ABI48_0_0RNScreens.h"

@implementation UIWindow (ABI48_0_0RNScreens)

- (void)didAddSubview:(UIView *)subview
{
  if (![subview isKindOfClass:[ABI48_0_0RNSFullWindowOverlayContainer class]]) {
    for (UIView *view in self.subviews) {
      if ([view isKindOfClass:[ABI48_0_0RNSFullWindowOverlayContainer class]]) {
        [self bringSubviewToFront:view];
      }
    }
  }
}

@end
