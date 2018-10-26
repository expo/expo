/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI31_0_0RCTNavigatorManager.h"

#import "ABI31_0_0RCTBridge.h"
#import "ABI31_0_0RCTConvert.h"
#import "ABI31_0_0RCTNavigator.h"
#import "ABI31_0_0RCTUIManager.h"
#import "ABI31_0_0RCTUIManagerObserverCoordinator.h"
#import "UIView+ReactABI31_0_0.h"

@interface ABI31_0_0RCTNavigatorManager () <ABI31_0_0RCTUIManagerObserver>

@end

@implementation ABI31_0_0RCTNavigatorManager
{
  // The main thread only.
  NSHashTable<ABI31_0_0RCTNavigator *> *_viewRegistry;
}

- (void)setBridge:(ABI31_0_0RCTBridge *)bridge
{
  [super setBridge:bridge];

  [self.bridge.uiManager.observerCoordinator addObserver:self];
}

- (void)invalidate
{
  [self.bridge.uiManager.observerCoordinator removeObserver:self];
}

ABI31_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  if (!_viewRegistry) {
    _viewRegistry = [NSHashTable hashTableWithOptions:NSPointerFunctionsWeakMemory];
  }

  ABI31_0_0RCTNavigator *view = [[ABI31_0_0RCTNavigator alloc] initWithBridge:self.bridge];
  [_viewRegistry addObject:view];
  return view;
}

ABI31_0_0RCT_EXPORT_VIEW_PROPERTY(requestedTopOfStack, NSInteger)
ABI31_0_0RCT_EXPORT_VIEW_PROPERTY(onNavigationProgress, ABI31_0_0RCTDirectEventBlock)
ABI31_0_0RCT_EXPORT_VIEW_PROPERTY(onNavigationComplete, ABI31_0_0RCTBubblingEventBlock)
ABI31_0_0RCT_EXPORT_VIEW_PROPERTY(interactivePopGestureEnabled, BOOL)

ABI31_0_0RCT_EXPORT_METHOD(requestSchedulingJavaScriptNavigation:(nonnull NSNumber *)ReactABI31_0_0Tag
                  callback:(ABI31_0_0RCTResponseSenderBlock)callback)
{
  [self.bridge.uiManager addUIBlock:
   ^(__unused ABI31_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, ABI31_0_0RCTNavigator *> *viewRegistry){
    ABI31_0_0RCTNavigator *navigator = viewRegistry[ReactABI31_0_0Tag];
    if ([navigator isKindOfClass:[ABI31_0_0RCTNavigator class]]) {
      BOOL wasAcquired = [navigator requestSchedulingJavaScriptNavigation];
      callback(@[@(wasAcquired)]);
    } else {
      ABI31_0_0RCTLogError(@"Cannot set lock: %@ (tag #%@) is not an ABI31_0_0RCTNavigator", navigator, ReactABI31_0_0Tag);
    }
  }];
}

#pragma mark - ABI31_0_0RCTUIManagerObserver

- (void)uiManagerDidPerformMounting:(__unused ABI31_0_0RCTUIManager *)manager
{
  ABI31_0_0RCTExecuteOnMainQueue(^{
    for (ABI31_0_0RCTNavigator *view in self->_viewRegistry) {
      [view uiManagerDidPerformMounting];
    }
  });
}

@end
