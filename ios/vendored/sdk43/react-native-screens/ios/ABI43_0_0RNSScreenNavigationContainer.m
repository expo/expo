#import "ABI43_0_0RNSScreenNavigationContainer.h"
#import "ABI43_0_0RNSScreen.h"
#import "ABI43_0_0RNSScreenContainer.h"

@implementation ABI43_0_0RNScreensContainerNavigationController

@end

@implementation ABI43_0_0RNSScreenNavigationContainerView

- (void)setupController
{
  self.controller = [[ABI43_0_0RNScreensContainerNavigationController alloc] init];
  [(ABI43_0_0RNScreensContainerNavigationController *)self.controller setNavigationBarHidden:YES animated:NO];
  [self addSubview:self.controller.view];
}

- (void)updateContainer
{
  for (ABI43_0_0RNSScreenView *screen in self.ABI43_0_0ReactSubviews) {
    if (screen.activityState == ABI43_0_0RNSActivityStateOnTop) {
      // there should never be more than one screen with `ABI43_0_0RNSActivityStateOnTop`
      // since this component should be used for `tabs` and `drawer` navigators
      [(ABI43_0_0RNScreensContainerNavigationController *)self.controller setViewControllers:@[ screen.controller ] animated:NO];
      [screen notifyFinishTransitioning];
    }
  }

  [self maybeDismissVC];
}

@end

@implementation ABI43_0_0RNSScreenNavigationContainerManager

ABI43_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  return [[ABI43_0_0RNSScreenNavigationContainerView alloc] init];
}

@end
