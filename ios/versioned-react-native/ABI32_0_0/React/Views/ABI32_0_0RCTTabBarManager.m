/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI32_0_0RCTTabBarManager.h"

#import "ABI32_0_0RCTBridge.h"
#import "ABI32_0_0RCTTabBar.h"
#import "ABI32_0_0RCTUIManager.h"
#import "ABI32_0_0RCTUIManagerObserverCoordinator.h"

@implementation ABI32_0_0RCTConvert (UITabBar)

ABI32_0_0RCT_ENUM_CONVERTER(UITabBarItemPositioning, (@{
  @"fill" : @(UITabBarItemPositioningFill),
  @"auto" : @(UITabBarItemPositioningAutomatic),
  @"center" : @(UITabBarItemPositioningCentered)
}), UITabBarItemPositioningAutomatic, integerValue)

@end

@interface ABI32_0_0RCTTabBarManager () <ABI32_0_0RCTUIManagerObserver>

@end

@implementation ABI32_0_0RCTTabBarManager
{
  // The main thread only.
  NSHashTable<ABI32_0_0RCTTabBar *> *_viewRegistry;
}

- (void)setBridge:(ABI32_0_0RCTBridge *)bridge
{
  [super setBridge:bridge];

  [self.bridge.uiManager.observerCoordinator addObserver:self];
}

- (void)invalidate
{
  [self.bridge.uiManager.observerCoordinator removeObserver:self];
}

ABI32_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  if (!_viewRegistry) {
    _viewRegistry = [NSHashTable hashTableWithOptions:NSPointerFunctionsWeakMemory];
  }

  ABI32_0_0RCTTabBar *view = [ABI32_0_0RCTTabBar new];
  [_viewRegistry addObject:view];
  return view;
}

ABI32_0_0RCT_EXPORT_VIEW_PROPERTY(unselectedTintColor, UIColor)
ABI32_0_0RCT_EXPORT_VIEW_PROPERTY(tintColor, UIColor)
ABI32_0_0RCT_EXPORT_VIEW_PROPERTY(barTintColor, UIColor)
ABI32_0_0RCT_EXPORT_VIEW_PROPERTY(translucent, BOOL)
#if !TARGET_OS_TV
ABI32_0_0RCT_EXPORT_VIEW_PROPERTY(barStyle, UIBarStyle)
#endif
ABI32_0_0RCT_EXPORT_VIEW_PROPERTY(itemPositioning, UITabBarItemPositioning)
ABI32_0_0RCT_EXPORT_VIEW_PROPERTY(unselectedItemTintColor, UIColor)

#pragma mark - ABI32_0_0RCTUIManagerObserver

- (void)uiManagerDidPerformMounting:(__unused ABI32_0_0RCTUIManager *)manager
{
  ABI32_0_0RCTExecuteOnMainQueue(^{
    for (ABI32_0_0RCTTabBar *view in self->_viewRegistry) {
      [view uiManagerDidPerformMounting];
    }
  });
}

@end
