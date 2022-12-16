/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ABI46_0_0React/ABI46_0_0RCTUIManager.h>

#import "ABI46_0_0RCTRefreshControl.h"
#import "ABI46_0_0RCTRefreshControlManager.h"
#import "ABI46_0_0RCTRefreshableProtocol.h"

@implementation ABI46_0_0RCTRefreshControlManager

ABI46_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  return [ABI46_0_0RCTRefreshControl new];
}

ABI46_0_0RCT_EXPORT_VIEW_PROPERTY(onRefresh, ABI46_0_0RCTDirectEventBlock)
ABI46_0_0RCT_EXPORT_VIEW_PROPERTY(refreshing, BOOL)
ABI46_0_0RCT_EXPORT_VIEW_PROPERTY(tintColor, UIColor)
ABI46_0_0RCT_EXPORT_VIEW_PROPERTY(title, NSString)
ABI46_0_0RCT_EXPORT_VIEW_PROPERTY(titleColor, UIColor)
ABI46_0_0RCT_EXPORT_VIEW_PROPERTY(progressViewOffset, CGFloat)

ABI46_0_0RCT_EXPORT_METHOD(setNativeRefreshing : (nonnull NSNumber *)viewTag toRefreshing : (BOOL)refreshing)
{
  [self.bridge.uiManager addUIBlock:^(ABI46_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
    UIView *view = viewRegistry[viewTag];

    if ([view conformsToProtocol:@protocol(ABI46_0_0RCTRefreshableProtocol)]) {
      [(id<ABI46_0_0RCTRefreshableProtocol>)view setRefreshing:refreshing];
    } else {
      ABI46_0_0RCTLogError(@"view must conform to protocol ABI46_0_0RCTRefreshableProtocol");
    }
  }];
}

@end
