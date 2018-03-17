/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI26_0_0RCTTabBarManager.h"

#import "ABI26_0_0RCTBridge.h"
#import "ABI26_0_0RCTTabBar.h"
#import "ABI26_0_0RCTUIManager.h"
#import "ABI26_0_0RCTUIManagerObserverCoordinator.h"

@implementation ABI26_0_0RCTConvert (UITabBar)

ABI26_0_0RCT_ENUM_CONVERTER(UITabBarItemPositioning, (@{
  @"fill" : @(UITabBarItemPositioningFill),
  @"auto" : @(UITabBarItemPositioningAutomatic),
  @"center" : @(UITabBarItemPositioningCentered)
}), UITabBarItemPositioningAutomatic, integerValue)

@end

@interface ABI26_0_0RCTTabBarManager () <ABI26_0_0RCTUIManagerObserver>

@end

@implementation ABI26_0_0RCTTabBarManager
{
  // The main thread only.
  NSHashTable<ABI26_0_0RCTTabBar *> *_viewRegistry;
}

- (void)setBridge:(ABI26_0_0RCTBridge *)bridge
{
  [super setBridge:bridge];

  [self.bridge.uiManager.observerCoordinator addObserver:self];
}

- (void)invalidate
{
  [self.bridge.uiManager.observerCoordinator removeObserver:self];
}

ABI26_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  if (!_viewRegistry) {
    _viewRegistry = [NSHashTable hashTableWithOptions:NSPointerFunctionsWeakMemory];
  }

  ABI26_0_0RCTTabBar *view = [ABI26_0_0RCTTabBar new];
  [_viewRegistry addObject:view];
  return view;
}

ABI26_0_0RCT_EXPORT_VIEW_PROPERTY(unselectedTintColor, UIColor)
ABI26_0_0RCT_EXPORT_VIEW_PROPERTY(tintColor, UIColor)
ABI26_0_0RCT_EXPORT_VIEW_PROPERTY(barTintColor, UIColor)
ABI26_0_0RCT_EXPORT_VIEW_PROPERTY(translucent, BOOL)
#if !TARGET_OS_TV
ABI26_0_0RCT_EXPORT_VIEW_PROPERTY(barStyle, UIBarStyle)
#endif
ABI26_0_0RCT_EXPORT_VIEW_PROPERTY(itemPositioning, UITabBarItemPositioning)
ABI26_0_0RCT_EXPORT_VIEW_PROPERTY(unselectedItemTintColor, UIColor)

#pragma mark - ABI26_0_0RCTUIManagerObserver

- (void)uiManagerDidPerformMounting:(__unused ABI26_0_0RCTUIManager *)manager
{
  ABI26_0_0RCTExecuteOnMainQueue(^{
    for (ABI26_0_0RCTTabBar *view in self->_viewRegistry) {
      [view uiManagerDidPerformMounting];
    }
  });
}

@end
