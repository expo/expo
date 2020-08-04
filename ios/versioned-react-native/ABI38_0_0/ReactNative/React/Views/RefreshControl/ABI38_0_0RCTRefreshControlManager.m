/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ABI38_0_0React/ABI38_0_0RCTUIManager.h>

#import "ABI38_0_0RCTRefreshControlManager.h"
#import "ABI38_0_0RCTRefreshableProtocol.h"
#import "ABI38_0_0RCTRefreshControl.h"

@implementation ABI38_0_0RCTRefreshControlManager

ABI38_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  return [ABI38_0_0RCTRefreshControl new];
}

ABI38_0_0RCT_EXPORT_VIEW_PROPERTY(onRefresh, ABI38_0_0RCTDirectEventBlock)
ABI38_0_0RCT_EXPORT_VIEW_PROPERTY(refreshing, BOOL)
ABI38_0_0RCT_EXPORT_VIEW_PROPERTY(tintColor, UIColor)
ABI38_0_0RCT_EXPORT_VIEW_PROPERTY(title, NSString)
ABI38_0_0RCT_EXPORT_VIEW_PROPERTY(titleColor, UIColor)

ABI38_0_0RCT_EXPORT_METHOD(setNativeRefreshing : (nonnull NSNumber *)viewTag toRefreshing : (BOOL)refreshing)
{
  [self.bridge.uiManager addUIBlock:^(ABI38_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
    UIView *view = viewRegistry[viewTag];

    if ([view conformsToProtocol:@protocol(ABI38_0_0RCTRefreshableProtocol)]) {
      [(id<ABI38_0_0RCTRefreshableProtocol>)view setRefreshing: refreshing];
    } else {
      ABI38_0_0RCTLogError(@"view must conform to protocol ABI38_0_0RCTRefreshableProtocol");
    }
  }];
}

@end
