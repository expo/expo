/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI31_0_0RCTRefreshControlManager.h"

#import "ABI31_0_0RCTRefreshControl.h"

@implementation ABI31_0_0RCTRefreshControlManager

ABI31_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  return [ABI31_0_0RCTRefreshControl new];
}

ABI31_0_0RCT_EXPORT_VIEW_PROPERTY(onRefresh, ABI31_0_0RCTDirectEventBlock)
ABI31_0_0RCT_EXPORT_VIEW_PROPERTY(refreshing, BOOL)
ABI31_0_0RCT_EXPORT_VIEW_PROPERTY(tintColor, UIColor)
ABI31_0_0RCT_EXPORT_VIEW_PROPERTY(title, NSString)
ABI31_0_0RCT_EXPORT_VIEW_PROPERTY(titleColor, UIColor)

@end
