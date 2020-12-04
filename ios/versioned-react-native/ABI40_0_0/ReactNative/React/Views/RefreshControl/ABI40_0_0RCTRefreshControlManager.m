/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ABI40_0_0React/ABI40_0_0RCTUIManager.h>

#import "ABI40_0_0RCTRefreshControl.h"
#import "ABI40_0_0RCTRefreshControlManager.h"
#import "ABI40_0_0RCTRefreshableProtocol.h"

@implementation ABI40_0_0RCTRefreshControlManager

ABI40_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  return [ABI40_0_0RCTRefreshControl new];
}

ABI40_0_0RCT_EXPORT_VIEW_PROPERTY(onRefresh, ABI40_0_0RCTDirectEventBlock)
ABI40_0_0RCT_EXPORT_VIEW_PROPERTY(refreshing, BOOL)
ABI40_0_0RCT_EXPORT_VIEW_PROPERTY(tintColor, UIColor)
ABI40_0_0RCT_EXPORT_VIEW_PROPERTY(title, NSString)
ABI40_0_0RCT_EXPORT_VIEW_PROPERTY(titleColor, UIColor)

ABI40_0_0RCT_EXPORT_METHOD(setNativeRefreshing : (nonnull NSNumber *)viewTag toRefreshing : (BOOL)refreshing)
{
  [self.bridge.uiManager addUIBlock:^(ABI40_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
    UIView *view = viewRegistry[viewTag];

    if ([view conformsToProtocol:@protocol(ABI40_0_0RCTRefreshableProtocol)]) {
      [(id<ABI40_0_0RCTRefreshableProtocol>)view setRefreshing:refreshing];
    } else {
      ABI40_0_0RCTLogError(@"view must conform to protocol ABI40_0_0RCTRefreshableProtocol");
    }
  }];
}

@end
