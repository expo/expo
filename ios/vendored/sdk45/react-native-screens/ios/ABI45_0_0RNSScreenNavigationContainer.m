#import "ABI45_0_0RNSScreenNavigationContainer.h"
#import "ABI45_0_0RNSScreen.h"
#import "ABI45_0_0RNSScreenContainer.h"

@implementation ABI45_0_0RNScreensContainerNavigationController

@end

@implementation ABI45_0_0RNSScreenNavigationContainerView

- (void)setupController
{
  self.controller = [[ABI45_0_0RNScreensContainerNavigationController alloc] init];
  [(ABI45_0_0RNScreensContainerNavigationController *)self.controller setNavigationBarHidden:YES animated:NO];
  [self addSubview:self.controller.view];
}

- (void)updateContainer
{
  for (ABI45_0_0RNSScreenView *screen in self.ABI45_0_0ReactSubviews) {
    if (screen.activityState == ABI45_0_0RNSActivityStateOnTop) {
      // there should never be more than one screen with `ABI45_0_0RNSActivityStateOnTop`
      // since this component should be used for `tabs` and `drawer` navigators
      [(ABI45_0_0RNScreensContainerNavigationController *)self.controller setViewControllers:@[ screen.controller ] animated:NO];
      [screen notifyFinishTransitioning];
    }
  }

  [self maybeDismissVC];
}

@end

@implementation ABI45_0_0RNSScreenNavigationContainerManager

ABI45_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  return [[ABI45_0_0RNSScreenNavigationContainerView alloc] init];
}

@end
