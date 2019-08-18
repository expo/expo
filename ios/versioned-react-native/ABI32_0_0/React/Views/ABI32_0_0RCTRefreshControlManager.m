/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI32_0_0RCTRefreshControlManager.h"

#import "ABI32_0_0RCTRefreshControl.h"

@implementation ABI32_0_0RCTRefreshControlManager

ABI32_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  return [ABI32_0_0RCTRefreshControl new];
}

ABI32_0_0RCT_EXPORT_VIEW_PROPERTY(onRefresh, ABI32_0_0RCTDirectEventBlock)
ABI32_0_0RCT_EXPORT_VIEW_PROPERTY(refreshing, BOOL)
ABI32_0_0RCT_EXPORT_VIEW_PROPERTY(tintColor, UIColor)
ABI32_0_0RCT_EXPORT_VIEW_PROPERTY(title, NSString)
ABI32_0_0RCT_EXPORT_VIEW_PROPERTY(titleColor, UIColor)

@end
