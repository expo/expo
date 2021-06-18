/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ABI42_0_0React/ABI42_0_0RCTUIManager.h>

#import "ABI42_0_0RCTRefreshControl.h"
#import "ABI42_0_0RCTRefreshControlManager.h"
#import "ABI42_0_0RCTRefreshableProtocol.h"

@implementation ABI42_0_0RCTRefreshControlManager

ABI42_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  return [ABI42_0_0RCTRefreshControl new];
}

ABI42_0_0RCT_EXPORT_VIEW_PROPERTY(onRefresh, ABI42_0_0RCTDirectEventBlock)
ABI42_0_0RCT_EXPORT_VIEW_PROPERTY(refreshing, BOOL)
ABI42_0_0RCT_EXPORT_VIEW_PROPERTY(tintColor, UIColor)
ABI42_0_0RCT_EXPORT_VIEW_PROPERTY(title, NSString)
ABI42_0_0RCT_EXPORT_VIEW_PROPERTY(titleColor, UIColor)

ABI42_0_0RCT_EXPORT_METHOD(setNativeRefreshing : (nonnull NSNumber *)viewTag toRefreshing : (BOOL)refreshing)
{
  [self.bridge.uiManager addUIBlock:^(ABI42_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
    UIView *view = viewRegistry[viewTag];

    if ([view conformsToProtocol:@protocol(ABI42_0_0RCTRefreshableProtocol)]) {
      [(id<ABI42_0_0RCTRefreshableProtocol>)view setRefreshing:refreshing];
    } else {
      ABI42_0_0RCTLogError(@"view must conform to protocol ABI42_0_0RCTRefreshableProtocol");
    }
  }];
}

@end
