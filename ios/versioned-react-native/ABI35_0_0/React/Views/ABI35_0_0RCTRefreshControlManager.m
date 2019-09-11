/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI35_0_0RCTRefreshControlManager.h"

#import "ABI35_0_0RCTRefreshControl.h"

@implementation ABI35_0_0RCTRefreshControlManager

ABI35_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  return [ABI35_0_0RCTRefreshControl new];
}

ABI35_0_0RCT_EXPORT_VIEW_PROPERTY(onRefresh, ABI35_0_0RCTDirectEventBlock)
ABI35_0_0RCT_EXPORT_VIEW_PROPERTY(refreshing, BOOL)
ABI35_0_0RCT_EXPORT_VIEW_PROPERTY(tintColor, UIColor)
ABI35_0_0RCT_EXPORT_VIEW_PROPERTY(title, NSString)
ABI35_0_0RCT_EXPORT_VIEW_PROPERTY(titleColor, UIColor)

@end
