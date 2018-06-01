/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI28_0_0RCTTabBarManager.h"

#import "ABI28_0_0RCTBridge.h"
#import "ABI28_0_0RCTTabBar.h"
#import "ABI28_0_0RCTUIManager.h"
#import "ABI28_0_0RCTUIManagerObserverCoordinator.h"

@implementation ABI28_0_0RCTConvert (UITabBar)

ABI28_0_0RCT_ENUM_CONVERTER(UITabBarItemPositioning, (@{
  @"fill" : @(UITabBarItemPositioningFill),
  @"auto" : @(UITabBarItemPositioningAutomatic),
  @"center" : @(UITabBarItemPositioningCentered)
}), UITabBarItemPositioningAutomatic, integerValue)

@end

@interface ABI28_0_0RCTTabBarManager () <ABI28_0_0RCTUIManagerObserver>

@end

@implementation ABI28_0_0RCTTabBarManager
{
  // The main thread only.
  NSHashTable<ABI28_0_0RCTTabBar *> *_viewRegistry;
}

- (void)setBridge:(ABI28_0_0RCTBridge *)bridge
{
  [super setBridge:bridge];

  [self.bridge.uiManager.observerCoordinator addObserver:self];
}

- (void)invalidate
{
  [self.bridge.uiManager.observerCoordinator removeObserver:self];
}

ABI28_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  if (!_viewRegistry) {
    _viewRegistry = [NSHashTable hashTableWithOptions:NSPointerFunctionsWeakMemory];
  }

  ABI28_0_0RCTTabBar *view = [ABI28_0_0RCTTabBar new];
  [_viewRegistry addObject:view];
  return view;
}

ABI28_0_0RCT_EXPORT_VIEW_PROPERTY(unselectedTintColor, UIColor)
ABI28_0_0RCT_EXPORT_VIEW_PROPERTY(tintColor, UIColor)
ABI28_0_0RCT_EXPORT_VIEW_PROPERTY(barTintColor, UIColor)
ABI28_0_0RCT_EXPORT_VIEW_PROPERTY(translucent, BOOL)
#if !TARGET_OS_TV
ABI28_0_0RCT_EXPORT_VIEW_PROPERTY(barStyle, UIBarStyle)
#endif
ABI28_0_0RCT_EXPORT_VIEW_PROPERTY(itemPositioning, UITabBarItemPositioning)
ABI28_0_0RCT_EXPORT_VIEW_PROPERTY(unselectedItemTintColor, UIColor)

#pragma mark - ABI28_0_0RCTUIManagerObserver

- (void)uiManagerDidPerformMounting:(__unused ABI28_0_0RCTUIManager *)manager
{
  ABI28_0_0RCTExecuteOnMainQueue(^{
    for (ABI28_0_0RCTTabBar *view in self->_viewRegistry) {
      [view uiManagerDidPerformMounting];
    }
  });
}

@end
