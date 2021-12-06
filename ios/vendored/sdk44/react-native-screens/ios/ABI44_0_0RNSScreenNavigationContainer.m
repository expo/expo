#import "ABI44_0_0RNSScreenNavigationContainer.h"
#import "ABI44_0_0RNSScreen.h"
#import "ABI44_0_0RNSScreenContainer.h"

@implementation ABI44_0_0RNScreensContainerNavigationController

@end

@implementation ABI44_0_0RNSScreenNavigationContainerView

- (void)setupController
{
  self.controller = [[ABI44_0_0RNScreensContainerNavigationController alloc] init];
  [(ABI44_0_0RNScreensContainerNavigationController *)self.controller setNavigationBarHidden:YES animated:NO];
  [self addSubview:self.controller.view];
}

- (void)updateContainer
{
  for (ABI44_0_0RNSScreenView *screen in self.ABI44_0_0ReactSubviews) {
    if (screen.activityState == ABI44_0_0RNSActivityStateOnTop) {
      // there should never be more than one screen with `ABI44_0_0RNSActivityStateOnTop`
      // since this component should be used for `tabs` and `drawer` navigators
      [(ABI44_0_0RNScreensContainerNavigationController *)self.controller setViewControllers:@[ screen.controller ] animated:NO];
      [screen notifyFinishTransitioning];
    }
  }

  [self maybeDismissVC];
}

@end

@implementation ABI44_0_0RNSScreenNavigationContainerManager

ABI44_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  return [[ABI44_0_0RNSScreenNavigationContainerView alloc] init];
}

@end
