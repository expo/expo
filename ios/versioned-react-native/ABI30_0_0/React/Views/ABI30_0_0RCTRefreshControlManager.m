/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI30_0_0RCTRefreshControlManager.h"

#import "ABI30_0_0RCTRefreshControl.h"

@implementation ABI30_0_0RCTRefreshControlManager

ABI30_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  return [ABI30_0_0RCTRefreshControl new];
}

ABI30_0_0RCT_EXPORT_VIEW_PROPERTY(onRefresh, ABI30_0_0RCTDirectEventBlock)
ABI30_0_0RCT_EXPORT_VIEW_PROPERTY(refreshing, BOOL)
ABI30_0_0RCT_EXPORT_VIEW_PROPERTY(tintColor, UIColor)
ABI30_0_0RCT_EXPORT_VIEW_PROPERTY(title, NSString)
ABI30_0_0RCT_EXPORT_VIEW_PROPERTY(titleColor, UIColor)

@end
