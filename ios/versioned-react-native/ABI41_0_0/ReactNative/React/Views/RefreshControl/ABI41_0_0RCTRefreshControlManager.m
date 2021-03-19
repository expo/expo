/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ABI41_0_0React/ABI41_0_0RCTUIManager.h>

#import "ABI41_0_0RCTRefreshControl.h"
#import "ABI41_0_0RCTRefreshControlManager.h"
#import "ABI41_0_0RCTRefreshableProtocol.h"

@implementation ABI41_0_0RCTRefreshControlManager

ABI41_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  return [ABI41_0_0RCTRefreshControl new];
}

ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(onRefresh, ABI41_0_0RCTDirectEventBlock)
ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(refreshing, BOOL)
ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(tintColor, UIColor)
ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(title, NSString)
ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(titleColor, UIColor)

ABI41_0_0RCT_EXPORT_METHOD(setNativeRefreshing : (nonnull NSNumber *)viewTag toRefreshing : (BOOL)refreshing)
{
  [self.bridge.uiManager addUIBlock:^(ABI41_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
    UIView *view = viewRegistry[viewTag];

    if ([view conformsToProtocol:@protocol(ABI41_0_0RCTRefreshableProtocol)]) {
      [(id<ABI41_0_0RCTRefreshableProtocol>)view setRefreshing:refreshing];
    } else {
      ABI41_0_0RCTLogError(@"view must conform to protocol ABI41_0_0RCTRefreshableProtocol");
    }
  }];
}

@end
