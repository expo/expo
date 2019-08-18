/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI33_0_0RCTRefreshControlManager.h"

#import "ABI33_0_0RCTRefreshControl.h"

@implementation ABI33_0_0RCTRefreshControlManager

ABI33_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  return [ABI33_0_0RCTRefreshControl new];
}

ABI33_0_0RCT_EXPORT_VIEW_PROPERTY(onRefresh, ABI33_0_0RCTDirectEventBlock)
ABI33_0_0RCT_EXPORT_VIEW_PROPERTY(refreshing, BOOL)
ABI33_0_0RCT_EXPORT_VIEW_PROPERTY(tintColor, UIColor)
ABI33_0_0RCT_EXPORT_VIEW_PROPERTY(title, NSString)
ABI33_0_0RCT_EXPORT_VIEW_PROPERTY(titleColor, UIColor)

@end
