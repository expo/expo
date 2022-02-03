#import "ABI44_0_0RNSFullWindowOverlay.h"
#import "UIWindow+ABI44_0_0RNScreens.h"

@implementation UIWindow (ABI44_0_0RNScreens)

- (void)didAddSubview:(UIView *)subview
{
  if (![subview isKindOfClass:[ABI44_0_0RNSFullWindowOverlayContainer class]]) {
    for (UIView *view in self.subviews) {
      if ([view isKindOfClass:[ABI44_0_0RNSFullWindowOverlayContainer class]]) {
        [self bringSubviewToFront:view];
      }
    }
  }
}

@end
