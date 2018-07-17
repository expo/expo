/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI29_0_0RCTNavigatorManager.h"

#import "ABI29_0_0RCTBridge.h"
#import "ABI29_0_0RCTConvert.h"
#import "ABI29_0_0RCTNavigator.h"
#import "ABI29_0_0RCTUIManager.h"
#import "ABI29_0_0RCTUIManagerObserverCoordinator.h"
#import "UIView+ReactABI29_0_0.h"

@interface ABI29_0_0RCTNavigatorManager () <ABI29_0_0RCTUIManagerObserver>

@end

@implementation ABI29_0_0RCTNavigatorManager
{
  // The main thread only.
  NSHashTable<ABI29_0_0RCTNavigator *> *_viewRegistry;
}

- (void)setBridge:(ABI29_0_0RCTBridge *)bridge
{
  [super setBridge:bridge];

  [self.bridge.uiManager.observerCoordinator addObserver:self];
}

- (void)invalidate
{
  [self.bridge.uiManager.observerCoordinator removeObserver:self];
}

ABI29_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  if (!_viewRegistry) {
    _viewRegistry = [NSHashTable hashTableWithOptions:NSPointerFunctionsWeakMemory];
  }

  ABI29_0_0RCTNavigator *view = [[ABI29_0_0RCTNavigator alloc] initWithBridge:self.bridge];
  [_viewRegistry addObject:view];
  return view;
}

ABI29_0_0RCT_EXPORT_VIEW_PROPERTY(requestedTopOfStack, NSInteger)
ABI29_0_0RCT_EXPORT_VIEW_PROPERTY(onNavigationProgress, ABI29_0_0RCTDirectEventBlock)
ABI29_0_0RCT_EXPORT_VIEW_PROPERTY(onNavigationComplete, ABI29_0_0RCTBubblingEventBlock)
ABI29_0_0RCT_EXPORT_VIEW_PROPERTY(interactivePopGestureEnabled, BOOL)

ABI29_0_0RCT_EXPORT_METHOD(requestSchedulingJavaScriptNavigation:(nonnull NSNumber *)ReactABI29_0_0Tag
                  callback:(ABI29_0_0RCTResponseSenderBlock)callback)
{
  [self.bridge.uiManager addUIBlock:
   ^(__unused ABI29_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, ABI29_0_0RCTNavigator *> *viewRegistry){
    ABI29_0_0RCTNavigator *navigator = viewRegistry[ReactABI29_0_0Tag];
    if ([navigator isKindOfClass:[ABI29_0_0RCTNavigator class]]) {
      BOOL wasAcquired = [navigator requestSchedulingJavaScriptNavigation];
      callback(@[@(wasAcquired)]);
    } else {
      ABI29_0_0RCTLogError(@"Cannot set lock: %@ (tag #%@) is not an ABI29_0_0RCTNavigator", navigator, ReactABI29_0_0Tag);
    }
  }];
}

#pragma mark - ABI29_0_0RCTUIManagerObserver

- (void)uiManagerDidPerformMounting:(__unused ABI29_0_0RCTUIManager *)manager
{
  ABI29_0_0RCTExecuteOnMainQueue(^{
    for (ABI29_0_0RCTNavigator *view in self->_viewRegistry) {
      [view uiManagerDidPerformMounting];
    }
  });
}

@end
