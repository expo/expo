/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI28_0_0RCTRefreshControlManager.h"

#import "ABI28_0_0RCTRefreshControl.h"

@implementation ABI28_0_0RCTRefreshControlManager

ABI28_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  return [ABI28_0_0RCTRefreshControl new];
}

ABI28_0_0RCT_EXPORT_VIEW_PROPERTY(onRefresh, ABI28_0_0RCTDirectEventBlock)
ABI28_0_0RCT_EXPORT_VIEW_PROPERTY(refreshing, BOOL)
ABI28_0_0RCT_EXPORT_VIEW_PROPERTY(tintColor, UIColor)
ABI28_0_0RCT_EXPORT_VIEW_PROPERTY(title, NSString)
ABI28_0_0RCT_EXPORT_VIEW_PROPERTY(titleColor, UIColor)

@end
