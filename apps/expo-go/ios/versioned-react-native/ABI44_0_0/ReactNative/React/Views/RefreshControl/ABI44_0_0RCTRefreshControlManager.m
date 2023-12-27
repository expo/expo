/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ABI44_0_0React/ABI44_0_0RCTUIManager.h>

#import "ABI44_0_0RCTRefreshControl.h"
#import "ABI44_0_0RCTRefreshControlManager.h"
#import "ABI44_0_0RCTRefreshableProtocol.h"

@implementation ABI44_0_0RCTRefreshControlManager

ABI44_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  return [ABI44_0_0RCTRefreshControl new];
}

ABI44_0_0RCT_EXPORT_VIEW_PROPERTY(onRefresh, ABI44_0_0RCTDirectEventBlock)
ABI44_0_0RCT_EXPORT_VIEW_PROPERTY(refreshing, BOOL)
ABI44_0_0RCT_EXPORT_VIEW_PROPERTY(tintColor, UIColor)
ABI44_0_0RCT_EXPORT_VIEW_PROPERTY(title, NSString)
ABI44_0_0RCT_EXPORT_VIEW_PROPERTY(titleColor, UIColor)

ABI44_0_0RCT_EXPORT_METHOD(setNativeRefreshing : (nonnull NSNumber *)viewTag toRefreshing : (BOOL)refreshing)
{
  [self.bridge.uiManager addUIBlock:^(ABI44_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
    UIView *view = viewRegistry[viewTag];

    if ([view conformsToProtocol:@protocol(ABI44_0_0RCTRefreshableProtocol)]) {
      [(id<ABI44_0_0RCTRefreshableProtocol>)view setRefreshing:refreshing];
    } else {
      ABI44_0_0RCTLogError(@"view must conform to protocol ABI44_0_0RCTRefreshableProtocol");
    }
  }];
}

@end
