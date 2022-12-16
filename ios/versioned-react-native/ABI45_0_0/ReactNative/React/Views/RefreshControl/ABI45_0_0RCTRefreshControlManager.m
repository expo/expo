/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ABI45_0_0React/ABI45_0_0RCTUIManager.h>

#import "ABI45_0_0RCTRefreshControl.h"
#import "ABI45_0_0RCTRefreshControlManager.h"
#import "ABI45_0_0RCTRefreshableProtocol.h"

@implementation ABI45_0_0RCTRefreshControlManager

ABI45_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  return [ABI45_0_0RCTRefreshControl new];
}

ABI45_0_0RCT_EXPORT_VIEW_PROPERTY(onRefresh, ABI45_0_0RCTDirectEventBlock)
ABI45_0_0RCT_EXPORT_VIEW_PROPERTY(refreshing, BOOL)
ABI45_0_0RCT_EXPORT_VIEW_PROPERTY(tintColor, UIColor)
ABI45_0_0RCT_EXPORT_VIEW_PROPERTY(title, NSString)
ABI45_0_0RCT_EXPORT_VIEW_PROPERTY(titleColor, UIColor)
ABI45_0_0RCT_EXPORT_VIEW_PROPERTY(progressViewOffset, CGFloat)

ABI45_0_0RCT_EXPORT_METHOD(setNativeRefreshing : (nonnull NSNumber *)viewTag toRefreshing : (BOOL)refreshing)
{
  [self.bridge.uiManager addUIBlock:^(ABI45_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
    UIView *view = viewRegistry[viewTag];

    if ([view conformsToProtocol:@protocol(ABI45_0_0RCTRefreshableProtocol)]) {
      [(id<ABI45_0_0RCTRefreshableProtocol>)view setRefreshing:refreshing];
    } else {
      ABI45_0_0RCTLogError(@"view must conform to protocol ABI45_0_0RCTRefreshableProtocol");
    }
  }];
}

@end
