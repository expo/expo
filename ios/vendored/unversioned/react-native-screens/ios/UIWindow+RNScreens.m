#import "RNSFullWindowOverlay.h"
#import "UIWindow+RNScreens.h"

@implementation UIWindow (RNScreens)

- (void)didAddSubview:(UIView *)subview
{
  if (![subview isKindOfClass:[RNSFullWindowOverlayContainer class]]) {
    for (UIView *view in self.subviews) {
      if ([view isKindOfClass:[RNSFullWindowOverlayContainer class]]) {
        [self bringSubviewToFront:view];
      }
    }
  }
}

@end
