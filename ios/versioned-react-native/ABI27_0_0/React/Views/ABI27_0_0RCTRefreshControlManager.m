/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI27_0_0RCTRefreshControlManager.h"

#import "ABI27_0_0RCTRefreshControl.h"

@implementation ABI27_0_0RCTRefreshControlManager

ABI27_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  return [ABI27_0_0RCTRefreshControl new];
}

ABI27_0_0RCT_EXPORT_VIEW_PROPERTY(onRefresh, ABI27_0_0RCTDirectEventBlock)
ABI27_0_0RCT_EXPORT_VIEW_PROPERTY(refreshing, BOOL)
ABI27_0_0RCT_EXPORT_VIEW_PROPERTY(tintColor, UIColor)
ABI27_0_0RCT_EXPORT_VIEW_PROPERTY(title, NSString)
ABI27_0_0RCT_EXPORT_VIEW_PROPERTY(titleColor, UIColor)

@end
