/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI24_0_0RCTNavigatorManager.h"

#import "ABI24_0_0RCTBridge.h"
#import "ABI24_0_0RCTConvert.h"
#import "ABI24_0_0RCTNavigator.h"
#import "ABI24_0_0RCTUIManager.h"
#import "UIView+ReactABI24_0_0.h"

@implementation ABI24_0_0RCTNavigatorManager

ABI24_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  return [[ABI24_0_0RCTNavigator alloc] initWithBridge:self.bridge];
}

ABI24_0_0RCT_EXPORT_VIEW_PROPERTY(requestedTopOfStack, NSInteger)
ABI24_0_0RCT_EXPORT_VIEW_PROPERTY(onNavigationProgress, ABI24_0_0RCTDirectEventBlock)
ABI24_0_0RCT_EXPORT_VIEW_PROPERTY(onNavigationComplete, ABI24_0_0RCTBubblingEventBlock)
ABI24_0_0RCT_EXPORT_VIEW_PROPERTY(interactivePopGestureEnabled, BOOL)

ABI24_0_0RCT_EXPORT_METHOD(requestSchedulingJavaScriptNavigation:(nonnull NSNumber *)ReactABI24_0_0Tag
                  callback:(ABI24_0_0RCTResponseSenderBlock)callback)
{
  [self.bridge.uiManager addUIBlock:
   ^(__unused ABI24_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, ABI24_0_0RCTNavigator *> *viewRegistry){
    ABI24_0_0RCTNavigator *navigator = viewRegistry[ReactABI24_0_0Tag];
    if ([navigator isKindOfClass:[ABI24_0_0RCTNavigator class]]) {
      BOOL wasAcquired = [navigator requestSchedulingJavaScriptNavigation];
      callback(@[@(wasAcquired)]);
    } else {
      ABI24_0_0RCTLogError(@"Cannot set lock: %@ (tag #%@) is not an ABI24_0_0RCTNavigator", navigator, ReactABI24_0_0Tag);
    }
  }];
}

@end
