#import "ABI49_0_0RNSScreenNavigationContainer.h"
#import "ABI49_0_0RNSScreen.h"
#import "ABI49_0_0RNSScreenContainer.h"

#ifdef ABI49_0_0RCT_NEW_ARCH_ENABLED
#import <ABI49_0_0React/ABI49_0_0RCTFabricComponentsPlugins.h>
#import <react/renderer/components/rnscreens/ComponentDescriptors.h>
#import <react/renderer/components/rnscreens/Props.h>
#endif

@implementation ABI49_0_0RNScreensContainerNavigationController

@end

@implementation ABI49_0_0RNSScreenNavigationContainerView

- (void)setupController
{
  self.controller = [[ABI49_0_0RNScreensContainerNavigationController alloc] init];
  [(ABI49_0_0RNScreensContainerNavigationController *)self.controller setNavigationBarHidden:YES animated:NO];
  [self addSubview:self.controller.view];
}

- (void)updateContainer
{
  for (ABI49_0_0RNSScreenView *screen in self.ABI49_0_0ReactSubviews) {
    if (screen.activityState == ABI49_0_0RNSActivityStateOnTop) {
      // there should never be more than one screen with `ABI49_0_0RNSActivityStateOnTop`
      // since this component should be used for `tabs` and `drawer` navigators
      [(ABI49_0_0RNScreensContainerNavigationController *)self.controller setViewControllers:@[ screen.controller ] animated:NO];
      [screen notifyFinishTransitioning];
    }
  }

  [self maybeDismissVC];
}

#pragma mark-- Fabric specific
#ifdef ABI49_0_0RCT_NEW_ARCH_ENABLED
+ (ABI49_0_0facebook::ABI49_0_0React::ComponentDescriptorProvider)componentDescriptorProvider
{
  return ABI49_0_0facebook::ABI49_0_0React::concreteComponentDescriptorProvider<
      ABI49_0_0facebook::ABI49_0_0React::ABI49_0_0RNSScreenNavigationContainerComponentDescriptor>();
}
#endif

@end

#ifdef ABI49_0_0RCT_NEW_ARCH_ENABLED
Class<ABI49_0_0RCTComponentViewProtocol> ABI49_0_0RNSScreenNavigationContainerCls(void)
{
  return ABI49_0_0RNSScreenNavigationContainerView.class;
}
#endif

@implementation ABI49_0_0RNSScreenNavigationContainerManager

ABI49_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  return [[ABI49_0_0RNSScreenNavigationContainerView alloc] init];
}

@end
