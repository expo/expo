/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI36_0_0RCTRefreshControlManager.h"

#import "ABI36_0_0RCTRefreshControl.h"

@implementation ABI36_0_0RCTRefreshControlManager

ABI36_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  return [ABI36_0_0RCTRefreshControl new];
}

ABI36_0_0RCT_EXPORT_VIEW_PROPERTY(onRefresh, ABI36_0_0RCTDirectEventBlock)
ABI36_0_0RCT_EXPORT_VIEW_PROPERTY(refreshing, BOOL)
ABI36_0_0RCT_EXPORT_VIEW_PROPERTY(tintColor, UIColor)
ABI36_0_0RCT_EXPORT_VIEW_PROPERTY(title, NSString)
ABI36_0_0RCT_EXPORT_VIEW_PROPERTY(titleColor, UIColor)

@end
