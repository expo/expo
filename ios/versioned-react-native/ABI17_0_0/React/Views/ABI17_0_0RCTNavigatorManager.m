/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI17_0_0RCTNavigatorManager.h"

#import "ABI17_0_0RCTBridge.h"
#import "ABI17_0_0RCTConvert.h"
#import "ABI17_0_0RCTNavigator.h"
#import "ABI17_0_0RCTUIManager.h"
#import "UIView+ReactABI17_0_0.h"

@implementation ABI17_0_0RCTNavigatorManager

ABI17_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  return [[ABI17_0_0RCTNavigator alloc] initWithBridge:self.bridge];
}

ABI17_0_0RCT_EXPORT_VIEW_PROPERTY(requestedTopOfStack, NSInteger)
ABI17_0_0RCT_EXPORT_VIEW_PROPERTY(onNavigationProgress, ABI17_0_0RCTDirectEventBlock)
ABI17_0_0RCT_EXPORT_VIEW_PROPERTY(onNavigationComplete, ABI17_0_0RCTBubblingEventBlock)
ABI17_0_0RCT_EXPORT_VIEW_PROPERTY(interactivePopGestureEnabled, BOOL)

// TODO: remove error callbacks
ABI17_0_0RCT_EXPORT_METHOD(requestSchedulingJavaScriptNavigation:(nonnull NSNumber *)ReactABI17_0_0Tag
                  errorCallback:(__unused ABI17_0_0RCTResponseSenderBlock)errorCallback
                  callback:(ABI17_0_0RCTResponseSenderBlock)callback)
{
  [self.bridge.uiManager addUIBlock:
   ^(__unused ABI17_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, ABI17_0_0RCTNavigator *> *viewRegistry){
    ABI17_0_0RCTNavigator *navigator = viewRegistry[ReactABI17_0_0Tag];
    if ([navigator isKindOfClass:[ABI17_0_0RCTNavigator class]]) {
      BOOL wasAcquired = [navigator requestSchedulingJavaScriptNavigation];
      callback(@[@(wasAcquired)]);
    } else {
      ABI17_0_0RCTLogError(@"Cannot set lock: %@ (tag #%@) is not an ABI17_0_0RCTNavigator", navigator, ReactABI17_0_0Tag);
    }
  }];
}

@end
