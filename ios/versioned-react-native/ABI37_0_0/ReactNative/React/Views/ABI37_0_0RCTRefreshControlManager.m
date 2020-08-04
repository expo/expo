/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI37_0_0RCTRefreshControlManager.h"

#import "ABI37_0_0RCTRefreshControl.h"

@implementation ABI37_0_0RCTRefreshControlManager

ABI37_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  return [ABI37_0_0RCTRefreshControl new];
}

ABI37_0_0RCT_EXPORT_VIEW_PROPERTY(onRefresh, ABI37_0_0RCTDirectEventBlock)
ABI37_0_0RCT_EXPORT_VIEW_PROPERTY(refreshing, BOOL)
ABI37_0_0RCT_EXPORT_VIEW_PROPERTY(tintColor, UIColor)
ABI37_0_0RCT_EXPORT_VIEW_PROPERTY(title, NSString)
ABI37_0_0RCT_EXPORT_VIEW_PROPERTY(titleColor, UIColor)

@end
