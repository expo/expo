/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ABI39_0_0React/ABI39_0_0RCTUIManager.h>

#import "ABI39_0_0RCTRefreshControl.h"
#import "ABI39_0_0RCTRefreshControlManager.h"
#import "ABI39_0_0RCTRefreshableProtocol.h"

@implementation ABI39_0_0RCTRefreshControlManager

ABI39_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  return [ABI39_0_0RCTRefreshControl new];
}

ABI39_0_0RCT_EXPORT_VIEW_PROPERTY(onRefresh, ABI39_0_0RCTDirectEventBlock)
ABI39_0_0RCT_EXPORT_VIEW_PROPERTY(refreshing, BOOL)
ABI39_0_0RCT_EXPORT_VIEW_PROPERTY(tintColor, UIColor)
ABI39_0_0RCT_EXPORT_VIEW_PROPERTY(title, NSString)
ABI39_0_0RCT_EXPORT_VIEW_PROPERTY(titleColor, UIColor)

ABI39_0_0RCT_EXPORT_METHOD(setNativeRefreshing : (nonnull NSNumber *)viewTag toRefreshing : (BOOL)refreshing)
{
  [self.bridge.uiManager addUIBlock:^(ABI39_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
    UIView *view = viewRegistry[viewTag];

    if ([view conformsToProtocol:@protocol(ABI39_0_0RCTRefreshableProtocol)]) {
      [(id<ABI39_0_0RCTRefreshableProtocol>)view setRefreshing:refreshing];
    } else {
      ABI39_0_0RCTLogError(@"view must conform to protocol ABI39_0_0RCTRefreshableProtocol");
    }
  }];
}

@end
