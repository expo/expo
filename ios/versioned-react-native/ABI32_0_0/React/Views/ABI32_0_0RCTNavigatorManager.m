/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI32_0_0RCTNavigatorManager.h"

#import "ABI32_0_0RCTBridge.h"
#import "ABI32_0_0RCTConvert.h"
#import "ABI32_0_0RCTNavigator.h"
#import "ABI32_0_0RCTUIManager.h"
#import "ABI32_0_0RCTUIManagerObserverCoordinator.h"
#import "UIView+ReactABI32_0_0.h"

@interface ABI32_0_0RCTNavigatorManager () <ABI32_0_0RCTUIManagerObserver>

@end

@implementation ABI32_0_0RCTNavigatorManager
{
  // The main thread only.
  NSHashTable<ABI32_0_0RCTNavigator *> *_viewRegistry;
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

  ABI32_0_0RCTNavigator *view = [[ABI32_0_0RCTNavigator alloc] initWithBridge:self.bridge];
  [_viewRegistry addObject:view];
  return view;
}

ABI32_0_0RCT_EXPORT_VIEW_PROPERTY(requestedTopOfStack, NSInteger)
ABI32_0_0RCT_EXPORT_VIEW_PROPERTY(onNavigationProgress, ABI32_0_0RCTDirectEventBlock)
ABI32_0_0RCT_EXPORT_VIEW_PROPERTY(onNavigationComplete, ABI32_0_0RCTBubblingEventBlock)
ABI32_0_0RCT_EXPORT_VIEW_PROPERTY(interactivePopGestureEnabled, BOOL)

ABI32_0_0RCT_EXPORT_METHOD(requestSchedulingJavaScriptNavigation:(nonnull NSNumber *)ReactABI32_0_0Tag
                  callback:(ABI32_0_0RCTResponseSenderBlock)callback)
{
  [self.bridge.uiManager addUIBlock:
   ^(__unused ABI32_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, ABI32_0_0RCTNavigator *> *viewRegistry){
    ABI32_0_0RCTNavigator *navigator = viewRegistry[ReactABI32_0_0Tag];
    if ([navigator isKindOfClass:[ABI32_0_0RCTNavigator class]]) {
      BOOL wasAcquired = [navigator requestSchedulingJavaScriptNavigation];
      callback(@[@(wasAcquired)]);
    } else {
      ABI32_0_0RCTLogError(@"Cannot set lock: %@ (tag #%@) is not an ABI32_0_0RCTNavigator", navigator, ReactABI32_0_0Tag);
    }
  }];
}

#pragma mark - ABI32_0_0RCTUIManagerObserver

- (void)uiManagerDidPerformMounting:(__unused ABI32_0_0RCTUIManager *)manager
{
  ABI32_0_0RCTExecuteOnMainQueue(^{
    for (ABI32_0_0RCTNavigator *view in self->_viewRegistry) {
      [view uiManagerDidPerformMounting];
    }
  });
}

@end
