/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI28_0_0RCTNavigatorManager.h"

#import "ABI28_0_0RCTBridge.h"
#import "ABI28_0_0RCTConvert.h"
#import "ABI28_0_0RCTNavigator.h"
#import "ABI28_0_0RCTUIManager.h"
#import "ABI28_0_0RCTUIManagerObserverCoordinator.h"
#import "UIView+ReactABI28_0_0.h"

@interface ABI28_0_0RCTNavigatorManager () <ABI28_0_0RCTUIManagerObserver>

@end

@implementation ABI28_0_0RCTNavigatorManager
{
  // The main thread only.
  NSHashTable<ABI28_0_0RCTNavigator *> *_viewRegistry;
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

  ABI28_0_0RCTNavigator *view = [[ABI28_0_0RCTNavigator alloc] initWithBridge:self.bridge];
  [_viewRegistry addObject:view];
  return view;
}

ABI28_0_0RCT_EXPORT_VIEW_PROPERTY(requestedTopOfStack, NSInteger)
ABI28_0_0RCT_EXPORT_VIEW_PROPERTY(onNavigationProgress, ABI28_0_0RCTDirectEventBlock)
ABI28_0_0RCT_EXPORT_VIEW_PROPERTY(onNavigationComplete, ABI28_0_0RCTBubblingEventBlock)
ABI28_0_0RCT_EXPORT_VIEW_PROPERTY(interactivePopGestureEnabled, BOOL)

ABI28_0_0RCT_EXPORT_METHOD(requestSchedulingJavaScriptNavigation:(nonnull NSNumber *)ReactABI28_0_0Tag
                  callback:(ABI28_0_0RCTResponseSenderBlock)callback)
{
  [self.bridge.uiManager addUIBlock:
   ^(__unused ABI28_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, ABI28_0_0RCTNavigator *> *viewRegistry){
    ABI28_0_0RCTNavigator *navigator = viewRegistry[ReactABI28_0_0Tag];
    if ([navigator isKindOfClass:[ABI28_0_0RCTNavigator class]]) {
      BOOL wasAcquired = [navigator requestSchedulingJavaScriptNavigation];
      callback(@[@(wasAcquired)]);
    } else {
      ABI28_0_0RCTLogError(@"Cannot set lock: %@ (tag #%@) is not an ABI28_0_0RCTNavigator", navigator, ReactABI28_0_0Tag);
    }
  }];
}

#pragma mark - ABI28_0_0RCTUIManagerObserver

- (void)uiManagerDidPerformMounting:(__unused ABI28_0_0RCTUIManager *)manager
{
  ABI28_0_0RCTExecuteOnMainQueue(^{
    for (ABI28_0_0RCTNavigator *view in self->_viewRegistry) {
      [view uiManagerDidPerformMounting];
    }
  });
}

@end
