/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI26_0_0RCTNavigatorManager.h"

#import "ABI26_0_0RCTBridge.h"
#import "ABI26_0_0RCTConvert.h"
#import "ABI26_0_0RCTNavigator.h"
#import "ABI26_0_0RCTUIManager.h"
#import "ABI26_0_0RCTUIManagerObserverCoordinator.h"
#import "UIView+ReactABI26_0_0.h"

@interface ABI26_0_0RCTNavigatorManager () <ABI26_0_0RCTUIManagerObserver>

@end

@implementation ABI26_0_0RCTNavigatorManager
{
  // The main thread only.
  NSHashTable<ABI26_0_0RCTNavigator *> *_viewRegistry;
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

  ABI26_0_0RCTNavigator *view = [[ABI26_0_0RCTNavigator alloc] initWithBridge:self.bridge];
  [_viewRegistry addObject:view];
  return view;
}

ABI26_0_0RCT_EXPORT_VIEW_PROPERTY(requestedTopOfStack, NSInteger)
ABI26_0_0RCT_EXPORT_VIEW_PROPERTY(onNavigationProgress, ABI26_0_0RCTDirectEventBlock)
ABI26_0_0RCT_EXPORT_VIEW_PROPERTY(onNavigationComplete, ABI26_0_0RCTBubblingEventBlock)
ABI26_0_0RCT_EXPORT_VIEW_PROPERTY(interactivePopGestureEnabled, BOOL)

ABI26_0_0RCT_EXPORT_METHOD(requestSchedulingJavaScriptNavigation:(nonnull NSNumber *)ReactABI26_0_0Tag
                  callback:(ABI26_0_0RCTResponseSenderBlock)callback)
{
  [self.bridge.uiManager addUIBlock:
   ^(__unused ABI26_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, ABI26_0_0RCTNavigator *> *viewRegistry){
    ABI26_0_0RCTNavigator *navigator = viewRegistry[ReactABI26_0_0Tag];
    if ([navigator isKindOfClass:[ABI26_0_0RCTNavigator class]]) {
      BOOL wasAcquired = [navigator requestSchedulingJavaScriptNavigation];
      callback(@[@(wasAcquired)]);
    } else {
      ABI26_0_0RCTLogError(@"Cannot set lock: %@ (tag #%@) is not an ABI26_0_0RCTNavigator", navigator, ReactABI26_0_0Tag);
    }
  }];
}

#pragma mark - ABI26_0_0RCTUIManagerObserver

- (void)uiManagerDidPerformMounting:(__unused ABI26_0_0RCTUIManager *)manager
{
  ABI26_0_0RCTExecuteOnMainQueue(^{
    for (ABI26_0_0RCTNavigator *view in self->_viewRegistry) {
      [view uiManagerDidPerformMounting];
    }
  });
}

@end
