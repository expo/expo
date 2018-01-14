/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI25_0_0RCTNavigatorManager.h"

#import "ABI25_0_0RCTBridge.h"
#import "ABI25_0_0RCTConvert.h"
#import "ABI25_0_0RCTNavigator.h"
#import "ABI25_0_0RCTUIManager.h"
#import "UIView+ReactABI25_0_0.h"

@implementation ABI25_0_0RCTNavigatorManager

ABI25_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  return [[ABI25_0_0RCTNavigator alloc] initWithBridge:self.bridge];
}

ABI25_0_0RCT_EXPORT_VIEW_PROPERTY(requestedTopOfStack, NSInteger)
ABI25_0_0RCT_EXPORT_VIEW_PROPERTY(onNavigationProgress, ABI25_0_0RCTDirectEventBlock)
ABI25_0_0RCT_EXPORT_VIEW_PROPERTY(onNavigationComplete, ABI25_0_0RCTBubblingEventBlock)
ABI25_0_0RCT_EXPORT_VIEW_PROPERTY(interactivePopGestureEnabled, BOOL)

ABI25_0_0RCT_EXPORT_METHOD(requestSchedulingJavaScriptNavigation:(nonnull NSNumber *)ReactABI25_0_0Tag
                  callback:(ABI25_0_0RCTResponseSenderBlock)callback)
{
  [self.bridge.uiManager addUIBlock:
   ^(__unused ABI25_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, ABI25_0_0RCTNavigator *> *viewRegistry){
    ABI25_0_0RCTNavigator *navigator = viewRegistry[ReactABI25_0_0Tag];
    if ([navigator isKindOfClass:[ABI25_0_0RCTNavigator class]]) {
      BOOL wasAcquired = [navigator requestSchedulingJavaScriptNavigation];
      callback(@[@(wasAcquired)]);
    } else {
      ABI25_0_0RCTLogError(@"Cannot set lock: %@ (tag #%@) is not an ABI25_0_0RCTNavigator", navigator, ReactABI25_0_0Tag);
    }
  }];
}

@end
