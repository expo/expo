/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ABI48_0_0React/ABI48_0_0RCTUIManager.h>

#import "ABI48_0_0RCTRefreshControl.h"
#import "ABI48_0_0RCTRefreshControlManager.h"
#import "ABI48_0_0RCTRefreshableProtocol.h"

@implementation ABI48_0_0RCTRefreshControlManager

ABI48_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  return [ABI48_0_0RCTRefreshControl new];
}

ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(onRefresh, ABI48_0_0RCTDirectEventBlock)
ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(refreshing, BOOL)
ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(tintColor, UIColor)
ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(title, NSString)
ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(titleColor, UIColor)
ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(progressViewOffset, CGFloat)

ABI48_0_0RCT_EXPORT_METHOD(setNativeRefreshing : (nonnull NSNumber *)viewTag toRefreshing : (BOOL)refreshing)
{
  [self.bridge.uiManager addUIBlock:^(ABI48_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
    UIView *view = viewRegistry[viewTag];

    if ([view conformsToProtocol:@protocol(ABI48_0_0RCTRefreshableProtocol)]) {
      [(id<ABI48_0_0RCTRefreshableProtocol>)view setRefreshing:refreshing];
    } else {
      ABI48_0_0RCTLogError(@"view must conform to protocol ABI48_0_0RCTRefreshableProtocol");
    }
  }];
}

@end
