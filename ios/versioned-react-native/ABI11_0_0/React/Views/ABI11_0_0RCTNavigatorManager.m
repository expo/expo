/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI11_0_0RCTNavigatorManager.h"

#import "ABI11_0_0RCTBridge.h"
#import "ABI11_0_0RCTConvert.h"
#import "ABI11_0_0RCTNavigator.h"
#import "ABI11_0_0RCTUIManager.h"
#import "UIView+ReactABI11_0_0.h"

@implementation ABI11_0_0RCTNavigatorManager

ABI11_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  return [[ABI11_0_0RCTNavigator alloc] initWithBridge:self.bridge];
}

ABI11_0_0RCT_EXPORT_VIEW_PROPERTY(requestedTopOfStack, NSInteger)
ABI11_0_0RCT_EXPORT_VIEW_PROPERTY(onNavigationProgress, ABI11_0_0RCTDirectEventBlock)
ABI11_0_0RCT_EXPORT_VIEW_PROPERTY(onNavigationComplete, ABI11_0_0RCTBubblingEventBlock)
ABI11_0_0RCT_EXPORT_VIEW_PROPERTY(interactivePopGestureEnabled, BOOL)

// TODO: remove error callbacks
ABI11_0_0RCT_EXPORT_METHOD(requestSchedulingJavaScriptNavigation:(nonnull NSNumber *)ReactABI11_0_0Tag
                  errorCallback:(__unused ABI11_0_0RCTResponseSenderBlock)errorCallback
                  callback:(ABI11_0_0RCTResponseSenderBlock)callback)
{
  [self.bridge.uiManager addUIBlock:
   ^(__unused ABI11_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, ABI11_0_0RCTNavigator *> *viewRegistry){
    ABI11_0_0RCTNavigator *navigator = viewRegistry[ReactABI11_0_0Tag];
    if ([navigator isKindOfClass:[ABI11_0_0RCTNavigator class]]) {
      BOOL wasAcquired = [navigator requestSchedulingJavaScriptNavigation];
      callback(@[@(wasAcquired)]);
    } else {
      ABI11_0_0RCTLogError(@"Cannot set lock: %@ (tag #%@) is not an ABI11_0_0RCTNavigator", navigator, ReactABI11_0_0Tag);
    }
  }];
}

@end
